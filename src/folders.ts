import path from "path";
import {access, symlink, unlink, lstat, readlink} from "fs/promises";
import fs from 'fs';

import dotenv from 'dotenv'
dotenv.config()

/**
 * Manage directories about the RocksDB snapshot folder structure
 */
const zeebeDataROPathEnv = process.env['ZEEBE_DATA_RO_PATH'] ??
  (() => {
    throw ("Missing env var ZEEBE_DATA_RO_PATH that declare the base path to the db folder, e.g.: ")
  })()

const zeebeDataBaseRWPathEnv = process.env['ZEEBE_DATA_RW_BASE_PATH'] ??
  (() => {
    throw ("Missing env var ZEEBE_DATA_RW_PATH that declare the base path to the db folder, e.g.: ")
  })()

const zeebeDataRWPathEnv = path.join(zeebeDataBaseRWPathEnv, 'symlink_to_zeebe_data')

class PartitionsMissingException extends Error {
  constructor (message? : string) {
    super(message)
    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name
    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

const printFolderContent = async (path: string, debugMessagePerFile: string) => {
  const filenames = await fs.promises.readdir(path)
  filenames.forEach((filename) => console.debug(`${debugMessagePerFile}: ${filename}`))
}

const zeebeFirstPartitionSubir = 'raft-partition/partitions/1'
export const runtimeDir = path.join(zeebeDataRWPathEnv, zeebeFirstPartitionSubir, 'runtime')

const zeebeCurrentDBPath = path.join(runtimeDir, 'CURRENT')

const isFolderWritable = async (path: string) => {
  try {
    await access(path, fs.constants.W_OK)
    return true
  } catch (e) {
    return false
  }
}

const checkFileExists = (s: string) => new Promise(r=>fs.access(s, fs.constants.F_OK, e => r(!e)))

type FolderType = 'symlink' | 'empty' | 'directory' | 'file' | 'unknown'

const getContentType = async (path: string): Promise<FolderType> => {
  try {
    const stat = await lstat(path)

    if (stat.isSymbolicLink()) return 'symlink'

    if (stat.isDirectory()) return 'directory'

    if (stat.isFile()) return 'directory'

    return 'unknown'
  } catch (e: any) {
    if (e.code === 'ENOENT') return 'empty'
    //if (e.code === 'EEXIST') return 'symlink'
    throw e  // for the moment
  }
}

/*
 * Check and set symlink configuration
 * raise PartitionsMissingException if the zeebedb seems not running
 */
export const setSymlink = async () => {
  // check if ZeebeRO folder is fine
  console.debug(`Checking and fixing folders state...`)
  console.debug(`[INFO] RO path: ${zeebeDataROPathEnv}`)
  console.debug(`[INFO] RW path: ${zeebeDataRWPathEnv}`)

  if (await isFolderWritable(zeebeDataROPathEnv)) {
    console.warn(`[KO] RO folder (${zeebeDataROPathEnv}) is writable, aborting...`)
    process.exit(0)
  } else {
    console.debug(` OK] RO folder (${zeebeDataROPathEnv}) is a ready-only folder`)
    await printFolderContent(zeebeDataROPathEnv, `  [OK][INFO] Content inside RO folder:`)
  }

  console.debug(`  [CHECK] RW content ${zeebeDataBaseRWPathEnv} (should be empty):`)

  if (await checkFileExists(zeebeDataRWPathEnv)) {
    console.debug(`  [Need fix] RW has something in it content, as RW should be a symlink, let's unlink it`)
    const contentType = await getContentType(zeebeDataRWPathEnv)

    if (contentType !== 'symlink') {
      console.debug(`  [KO] RW has something that is not a symlink, aborting`)
      process.exit(0)
    } else {
      await unlink(zeebeDataRWPathEnv)
      console.debug(`  [OK] RW content should be empty now`)
    }
  } else {
    console.debug(`  [OK] RW content is empty`)
  }

  console.debug(`[Set] Creating the symlink inside the RW to the RO..`)
  await symlink( `${zeebeDataROPathEnv}`, `${zeebeDataRWPathEnv}`)

  console.debug(`  [Checking] is the target a valid symlink ?..`)
  const target = await readlink(zeebeDataRWPathEnv)
  console.debug(`[OK] Symlink target is ${target}`)

  try {
    console.debug(`[Checking] is the runtime dir writable ?..`)
    await access(runtimeDir, fs.constants.W_OK)
  } catch (e) {
    console.warn(`[KO] Warning: Unable to write into the RW folder ${zeebeDataRWPathEnv}`)
  }

  // check the zeebe partition is here
  try {
    console.debug(`[Checking] does the "CURRENT" Zeebe file exists ?..`)
    await access(zeebeCurrentDBPath, fs.constants.R_OK)
  } catch (e) {
    console.error(`[KO] Unable to read the CURRENT db ${zeebeDataRWPathEnv}`)
    throw new PartitionsMissingException()
  }
  console.debug(`[OK] folder "CURRENT" exists`)

  console.debug(`[Folders check] All good !`)
}
