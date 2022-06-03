import RocksDB from "rocksdb";
import levelup, { LevelUp } from "levelup";
import { ZbColumnFamilies } from "./zbColumnFamilies";
import { Buffer } from 'node:buffer'

// TODO: add the possibility to read CURRENT + X SNAPSHOTS
// TODO: @dom assert we want current, because https://github.com/google/leveldb/blob/main/doc/index.md#snapshots
// TODO: make it work with phd-assess local docker-compose
// TODO: set a pod on phd-test

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

export class ZeebeDB {
  db: LevelUp<RocksDB>

  constructor(path: string) {
    this.db = levelup(
      RocksDB(path)
      , {
        createIfMissing: false,
        readOnly: true,
        infoLogLevel: 'debug'
      },
      (err: Error | undefined) => {
        if (err) console.log(err)
      }
    )
  }

  walkColumnFamily(columnFamilyName: keyof typeof ZbColumnFamilies, callback: (key: string, value: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.createReadStream({
        gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
        lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
      })
        .on('data', function (data) {
          callback(data.key, data.value)
        })
        .on('error', function (err) {
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
