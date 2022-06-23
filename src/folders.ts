import path from "path";
import {readdir} from "fs";

/**
 * Manage directories about the RocksDB snapshot folder structure
 */

const zeebeDataPathEnv = process.env['ZEEBE_DATA_PATH'] ??
  (() => {
    throw ("Missing env var ZEEBE_DATA_PATH that declare the base path to the db folder, e.g.: ")
  })()

const zeebeFirstPartitionSubir = 'raft-partition/partitions/1'
export const runtimeDir = path.join(zeebeDataPathEnv, zeebeFirstPartitionSubir, 'runtime')
const snapshotsSubDir = path.join(zeebeFirstPartitionSubir, 'snapshots')

/**
 * get the first folder (will be a snapshot number), or undefined if no snapshot
 * Currently unused, because as the dynamic way snapshots are created, a simple symlink is not enough
 */
export const forEachSnapshots = async (callback: (snapshotFullPath: string, snapshotName: string) => void) => {
  const snapshotPath = path.join(zeebeDataPathEnv, snapshotsSubDir)

  await readdir(
    snapshotPath, { withFileTypes: true }, ((err, files) => {
      if (err) {
        throw err
      } else {
        console.debug(`Listing folders/files`)
        files.filter(dirent => dirent.isDirectory()).map((dirent) => {
            console.debug(`running on ${dirent.name}`)
            callback(path.join(snapshotPath, dirent.name), dirent.name)
          }
        );
      }
   })
  )
}
