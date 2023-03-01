import RocksDB from "rocksdb";
import levelup, {LevelUp} from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies.js";
import { Buffer } from 'node:buffer'
import {unpack} from "msgpackr";
import { Readable } from "stream";
import {RuntimeDir} from "./folders.js";
import memoizee from 'memoizee';


const ZDB_READ_CACHE_TIMEOUT = process.env.ZDB_READ_CACHE_TIMEOUT ? parseInt(process.env.ZDB_READ_CACHE_TIMEOUT) : 60000 // default to 1 minutes

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

async function ZDB() {
  let lastError : Error | undefined = undefined;
  let runtimeDir : Awaited<ReturnType<typeof RuntimeDir>> | undefined = undefined;
  let zdbInstance: LevelUp<RocksDB> | undefined = undefined;

  for (let i of [1,2]) {
    try {
      runtimeDir = await RuntimeDir();
      zdbInstance = levelup(
        RocksDB(runtimeDir.dir),
        {
          createIfMissing: false,
          readOnly: true
        } );
      break;
    } catch (e : any) {
      if (runtimeDir) await runtimeDir.delete();
      lastError = e;
    }
  }

  if (! zdbInstance ) {
    throw lastError;
  }

  return {
    db: zdbInstance,
    async close() {
      if (zdbInstance) await zdbInstance.close();
      if (runtimeDir) await runtimeDir.delete();
    }
  }
}

export async function walkColumnFamily(
  columnFamilyName: keyof typeof ZbColumnFamilies,
  walkType: 'key'|'keyValue'|'value' = 'key') {

  const { db, close } = await ZDB()

  try {
    if (walkType === 'keyValue') {
      return await Readable.from(
        db.createReadStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
      )
    } else if (walkType === 'value') {
      return await Readable.from(
        db.createValueStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
      )
    } else {
      return await Readable.from(
        db.createKeyStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
      )
    }
  } finally {
    await close()
  }
}

/*
 * Get a Map of column families as (columnFamilyName, count)
 * Get only the ones with at least a value
 */
export async function ColumnFamiliesCount() {
  try {
    await ZDB()

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
