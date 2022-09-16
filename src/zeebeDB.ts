import RocksDB from "rocksdb";
import levelup, {LevelUp} from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies.js";
import { Buffer } from 'node:buffer'
import {unpack} from "msgpackr";
import { Readable } from "stream";
import {setSymlink, runtimeDir} from "./folders.js";
import memoizee from 'memoizee';


const ZDB_READ_CACHE_TIMEOUT = process.env.ZDB_READ_CACHE_TIMEOUT ? parseInt(process.env.ZDB_READ_CACHE_TIMEOUT) : 60000 // default to 1 minutes

type ZeebeStreamData = {
  key: string
  value: Buffer
}

/**
 * @param cfName The column family name as a fully typed-out string, e.g. "PROCESS_CACHE_BY_ID_AND_VERSION".
 *               See zbColumnFamilies.ts for the awaited values
 * @param offset Either 0 or 1. Don't use other numbers :)
 */
const columnFamilyNametoInt64Bytes = (cfName: keyof typeof ZbColumnFamilies, offset: number) => {
  const cfNum = ZbColumnFamilies[cfName]
  return int64ToBytes(cfNum + offset)
}

const int64ToBytes = (i : number) : Uint8Array => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(i))
  return buf
}

let _zdbInstance: LevelUp<RocksDB>

async function initZDB() {
  if (_zdbInstance && _zdbInstance.isOpen()) return

  try {
    console.debug(`${new Date().toISOString()} Instancing the levelup reader`)
    _zdbInstance = levelup(
      RocksDB(runtimeDir),
      {
        createIfMissing: false,
        readOnly: true,
        infoLogLevel: 'error'
      }
    )
  } catch (e: any) {
    console.error(`Creating the RocksDB reader crashed : ${e.message}`)
    // TODO: check what kind of error we got
    // try to rebuild the symlink for *all* cases at the moment
    await setSymlink()

    // second try. If not, let the error raise to the main application
    console.debug("Instancing a second time the levelup reader")
    _zdbInstance = levelup(
      RocksDB(runtimeDir),
      {
        createIfMissing: false,
        readOnly: true,
        infoLogLevel: 'error'
      }
    )
  }
}

export async function walkColumnFamily(
  columnFamilyName: keyof typeof ZbColumnFamilies,
  walkType: 'key'|'keyValue'|'value' = 'key') {

  await initZDB()

  if (walkType === 'keyValue') {
    return Readable.from(
        _zdbInstance.createReadStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
    )
  } else if (walkType === 'value') {
    return Readable.from(
        _zdbInstance.createValueStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
    )
  } else {
    return Readable.from(
        _zdbInstance.createKeyStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
    )
  }
}

/*
 * Get a Map of column families as (columnFamilyName, count)
 * Get only the ones with at least a value
 */
export async function ColumnFamiliesCount() {
  try {
    await initZDB()

    const columFamiliesCounted = new Map<string, number>()

    for (let columnFamilyName of columnFamiliesNames) {
      let count: number | undefined;

      for await (const row of await walkColumnFamily(columnFamilyName, 'key')) {
        !count ? count = 1 : count++;
      }

      count && columFamiliesCounted.set(columnFamilyName, count)
    }

    return columFamiliesCounted
  } catch (e) {
    console.error(e)
    // get all or nothing if an error raised
    return new Map<string, number>()
  }
}

export const memoizedColumnFamiliesCount = memoizee(
  ColumnFamiliesCount,
  {
    maxAge: ZDB_READ_CACHE_TIMEOUT,
  }
)

async function incidentsMessageCount() {
  try {
    const incidentMessages: string[] = []

    for await (const row of await walkColumnFamily('INCIDENTS', 'keyValue')) {
      const unpackedValue = unpack(row.value)
      incidentMessages.push(unpackedValue?.incidentRecord?.errorMessage)
    }

    const incidentCountPerMessage = new Map<string, number>()

    // group by errorMessage and set the mesure
    incidentMessages.forEach((message) => {
      // add to Map
      if (!incidentCountPerMessage.has(message)) incidentCountPerMessage.set(message, 0)
      incidentCountPerMessage.set(message, incidentCountPerMessage.get(message)! +1)
    })

    return incidentCountPerMessage

  } catch (e) {
    console.error(e)
    // get all or nothing if an error raised
    return new Map<string, number>()
  }
}

export const memoizedIncidentsMessageCount = memoizee(
  incidentsMessageCount,
  {
    maxAge: ZDB_READ_CACHE_TIMEOUT,
  }
)

export async function closeDB() {
  _zdbInstance && _zdbInstance.isOpen() && await _zdbInstance.close()
}
