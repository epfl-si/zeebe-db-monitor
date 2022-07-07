import RocksDB from "rocksdb";
import levelup from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies";
import { Buffer } from 'node:buffer'
import {unpack} from "msgpackr";
import StreamToAsyncIterator from "stream-to-async-iterator"
import { Readable } from "stream";
import {runtimeDir} from "./folders";


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

  async refresh() {
    // force refresh of the db
    if (this.isOpen()) await this.close()
    await this.open()
  }

  async walkColumnFamily(columnFamilyName: keyof typeof ZbColumnFamilies) {
    return new StreamToAsyncIterator<ZeebeStreamData>(
      Readable.from(
        this.createReadStream({
          gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
          lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
        })
      )
    )
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

        for await (const row of await this.walkColumnFamily(columnFamilyName)) {
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

  async getIncidentsMessageCount() {
    try {
      const incidentMessages: string[] = []

      for await (const row of await this.walkColumnFamily('INCIDENTS')) {
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
}

export const zdb = new ZDB(runtimeDir)
