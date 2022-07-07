import RocksDB from "rocksdb";
import levelup from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies";
import { Buffer } from 'node:buffer'


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
        infoLogLevel: 'debug'
      }
    )
  }

  async forceRefresh() {
    // force refresh of the db
    if (this.isOpen()) await this.close()
    await this.open()
  }

  /*
   * Get a Map of column families as (columnFamilyName, count)
   * Get only the ones with at least a value
   */
  async countColumnFamilies() {
    await this.forceRefresh()

    try {
      const columFamiliesCounted = new Map<string, number>()

      for (let columnFamilyName of columnFamiliesNames) {
        let count: number | undefined;
        await this.walkColumnFamily(columnFamilyName, function () {
          !count ? count = 1 : count++;
        })

        count && columFamiliesCounted.set(columnFamilyName, count)
      }

      return columFamiliesCounted
    } catch (e) {
      // get all or nothing if an error raised
      return new Map<string, number>()
    }
  }

  async walkColumnFamily(columnFamilyName: keyof typeof ZbColumnFamilies, callback: (key: string, value: string) => void): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.createReadStream({
        gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
        lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
      })
        .on('data', function (data) {
          callback(data.key, data.value)
        })
        .on('error', function (err) {
          console.error(`Error when walking on ColumnFamily ${columnFamilyName}: ${err}`)
          reject(err)
        })
        .on('close', function () {
        })
        .on('end', function () {
          resolve()
        })
    })
  }
}
