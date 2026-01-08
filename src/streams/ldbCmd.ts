/**
 * Provide an object ready to be spawned for the ldb command tool
 * See the doc about ldb on
 * https://github.com/facebook/rocksdb/wiki/Administration-and-Data-Access-Tool
 */
import {ZbColumnFamilies} from "../zbColumnFamilies.js";
import {spawn} from "node:child_process";

export type LdbReaderOptions = {
  // filter for a specific columnFamily
  columnFamilyName?: keyof typeof ZbColumnFamilies | string
  limit?: number
  keys_only?: boolean
  skipColumnFamilyNames?: (keyof typeof ZbColumnFamilies)[]
}

export const spawnLDBCommand = (
  zeebePartitionPath: string,
  options?: LdbReaderOptions
) => {
  /*
 * Check if we need a specific column family
 */
  let columnFamilyFrom, columnFamilyTo
  if (options?.columnFamilyName) {
    try {
      const cfFromNumber = ZbColumnFamilies[options.columnFamilyName as keyof typeof ZbColumnFamilies]
      columnFamilyFrom = cfFromNumber.toString(16).padStart(16, '0')
      columnFamilyTo = (cfFromNumber + 1).toString(16).padStart(16, '0')
    } catch (e) {
      throw new Error("Unable to identify the requested column family name")
    }
  }

  const command = 'ldb'
  const args = [
    `--db=${ zeebePartitionPath }`,
    // scan -> User keys and values (string/hex) -> Data inspection
    // idump -> Internal keys (with meta-info) -> Debug RocksDB internals
    'scan',
    '--hex',
    // set a new path where to write logs files, preserving the RW DB
    // `--secondary_path=${ fs.mkdtempSync(`${ os.tmpdir() }/zeebe-ldb-secondary-`) }`,
    ... options?.keys_only ? [`--no_value`] : [],
    ... options?.limit ? [`--max_keys=${ options.limit }`] : [],
    ... columnFamilyFrom && columnFamilyTo ?
      [`--from=0x${ columnFamilyFrom }`] : [],
    ... columnFamilyFrom && columnFamilyTo ?
      [`--to=0x${ columnFamilyTo }`] : [],
  ]

  if (
    process.env.ZEEBE_DB_MONITOR_CMD_DEBUG &&
    process.env.ZEEBE_DB_MONITOR_CMD_DEBUG == "true"
  ) {
    console.debug(`Preparing the command: ${ [command, ...args].join(' ') } `)
  }

  const spawnLlb = spawn(command, args)

  // don't allow ldb errors to stay in the dark
  spawnLlb.stderr.on('data', d => {
    console.log('ldb error:', d.toString());
  });

  return spawnLlb
}
