import path from "path";
import os from "os";
import {access, symlink, unlink, lstat, readlink, mkdtemp, mkdir, readdir} from "fs/promises";
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

const isFolderWritable = async (path: string) => {
  try {
    await access(path, fs.constants.W_OK)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Prepare and return a symlinked ZeebeDB.
 *
 * @return The path in which the symlinked `CURRENT` file exists.
 */
export async function makeRuntimeDir(sourceZeebe ?: string) {
  if (! sourceZeebe) sourceZeebe = zeebeDataROPathEnv;
  // check if ZeebeRO folder is fine
  console.debug(`Checking and fixing folders state...`)
  console.debug(`[INFO] RO path: ${sourceZeebe}`)

  if (await isFolderWritable(sourceZeebe)) {
    console.warn(`[KO] RO folder (${sourceZeebe}) is writable, aborting...`)
    process.exit(0)
  } else {
    console.debug(` OK] RO folder (${sourceZeebe}) is a ready-only folder`)
    await printFolderContent(sourceZeebe, `  [OK][INFO] Content inside RO folder:`)
  }

  const symlinksdir = await mkdtemp(path.join(os.tmpdir(), 'zeebe-db-symlink-'));

  console.debug(`[Set] Creating the symlink inside the RW to the RO..`)
  const runtimeDir = path.join(symlinksdir, 'runtime');
  await mkdir(runtimeDir);

  for (const toSymlink of await readdir(sourceZeebe)) {
    if ( ! ((toSymlink === ".") || (toSymlink === "..")) ) {
      await symlink(path.join(sourceZeebe, toSymlink), path.join(runtimeDir, toSymlink));
    }
  }

  // check the zeebe partition is here
  const zeebeCurrentDBPath = path.join(runtimeDir, 'CURRENT');
  try {
    console.debug(`[Checking] does the "CURRENT" Zeebe file exists ?..`)
    await access(zeebeCurrentDBPath, fs.constants.R_OK)
  } catch (e) {
    console.error(`[KO] Unable to read the CURRENT db through ${zeebeCurrentDBPath} symlink`)
    throw new PartitionsMissingException()
  }
  console.debug(`[OK] folder "CURRENT" exists`)

  console.debug(`[Folders check] All good !`)
  return runtimeDir;
}
