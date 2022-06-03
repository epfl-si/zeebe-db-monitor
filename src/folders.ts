import path from "path";
import {getDirectories} from "./utils";

/**
 * Manage directories about the RocksDB snapshot folder structure
 */

// TODO: Manage multiple snapshots in the directory
// TODO: Manage the CURRENT if available

const snapshotPathEnv = process.env['SNAPSHOT_PATH'] ??
  (() => {
    throw ("Missing env var SNAPSHOT_PATH that declare the base path to the snapshots folder, e.g.: ")
  })()

const snapshotsSubDir = 'raft-partition/partitions/1/snapshots'

export const snapshotFolderName = getDirectories(path.join(snapshotPathEnv, snapshotsSubDir))[0]  // get the first folder (will be a snapshot number)

export const snapshotsWorkingDir = path.join(
  snapshotPathEnv,
  snapshotsSubDir,
  snapshotFolderName,
)
