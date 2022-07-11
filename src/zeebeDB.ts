import RocksDB from "rocksdb";
import levelup from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies";
import { Buffer } from 'node:buffer'
import {unpack} from "msgpackr";
import StreamToAsyncIterator from "stream-to-async-iterator"
import { Readable } from "stream";
import {runtimeDir} from "./folders";
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

export class ZDB extends levelup {
  constructor(path: string) {
    super(
      RocksDB(path),
      {
        createIfMissing: false,
        readOnly: true,
        infoLogLevel: 'error'
      }
    )
  }

  async walkColumnFamily(
    columnFamilyName: keyof typeof ZbColumnFamilies,
    walkType: 'key'|'keyValue'|'value' = 'key') {

    console.log(`walkingFamily ${columnFamilyName}...`)
    if (!this.open()) throw `db is not open, skipping`

    if (walkType === 'keyValue') {
      return new StreamToAsyncIterator<ZeebeStreamData>(
        Readable.from(
          this.createReadStream({
            gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
            lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
          })
        )
      )
    } else if (walkType === 'value') {
      return new StreamToAsyncIterator<ZeebeStreamData>(
        Readable.from(
          this.createValueStream({
            gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
            lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
          })
        )
      )
    } else {
      return new StreamToAsyncIterator<ZeebeStreamData>(
        Readable.from(
          this.createKeyStream({
            gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
            lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
          })
        )
      )
    }
  }

  /*
   * Get a Map of column families as (columnFamilyName, count)
   * Get only the ones with at least a value
   */
  async ColumnFamiliesCount() {
    try {
      const columFamiliesCounted = new Map<string, number>()

      for (let columnFamilyName of columnFamiliesNames) {
        let count: number | undefined;

        for await (const row of await this.walkColumnFamily(columnFamilyName, 'key')) {
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

  memoizedColumnFamiliesCount = memoizee(
    this.ColumnFamiliesCount,
    {
      maxAge: ZDB_READ_CACHE_TIMEOUT,
    }
  )

  async incidentsMessageCount() {
    try {
      const incidentMessages: string[] = []

      for await (const row of await this.walkColumnFamily('INCIDENTS', 'keyValue')) {
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

  memoizedIncidentsMessageCount = memoizee(
    this.incidentsMessageCount,
    {
      maxAge: ZDB_READ_CACHE_TIMEOUT,
    }
  )
}

export const zdb = new ZDB(runtimeDir)
