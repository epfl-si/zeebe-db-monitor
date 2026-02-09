import fs from "node:fs";
import {pipeline} from "node:stream/promises";

import {LdbReaderOptions, spawnLDBCommand} from "./ldbCmd.js";
import {ldbToJSONSTransform, ldbToObjectTransform} from "./decoder.js";
import {CountByFamilyName, CountPerIncidentMessage} from "./counter.js";


/**
 * Fetch the Zeebe partition lines into a file
 */
export const exportDbToJsonFile = async (
  zeebePartitionPath: string,
  outputFilePath: string,
  options?: LdbReaderOptions
) => {
  if (!zeebePartitionPath) throw new Error('Missing a zeebe partition path')

  const outputStream = fs.createWriteStream(outputFilePath, { flags: 'a' })

  const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)

  const ldbToJSONSTransformer = new ldbToJSONSTransform()
  ldbToJSONSTransformer.on('warn', (err: any) => console.warn(`Warn: ${err}`))

  await pipeline(
    ldbCmd.stdout,
    ldbToJSONSTransformer,
    outputStream,
  )
}

export const exportDbToConsoleAsJSON = async (
  zeebePartitionPath: string,
  options?: LdbReaderOptions
) => {
  if (!zeebePartitionPath) throw new Error('Missing a zeebe partition path')

  const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)

  const ldbToJSONSTransformer = new ldbToJSONSTransform()

  await pipeline(
    ldbCmd.stdout,
    ldbToJSONSTransformer,
    process.stdout,
  )
}

/*
 * Run the pipeline to decode the key from a ldb output, then groupBy and
 * count the family keys
 */
export const columnFamiliesCounter = async () => {
  const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH
  if (!zeebePartitionPath) throw new Error('Missing a zeebe partition path')

  const ldbToMapTransformer = new ldbToObjectTransform()

  const ldbCmd = spawnLDBCommand(
    zeebePartitionPath,
    { keys_only: true },
  )

  const counter = new CountByFamilyName();

  await pipeline(
    ldbCmd.stdout,
    ldbToMapTransformer,
    counter,
  );

  return counter.counted
}

export const incidentsPerMessageCounter = async () => {
  const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH
  if (!zeebePartitionPath) throw new Error('Missing a zeebe partition path')

  const ldbToMapTransformer = new ldbToObjectTransform()

  const ldbCmd = spawnLDBCommand(
    zeebePartitionPath,
    {
      keys_only: false,
      columnFamilyName: 'INCIDENTS',
    }
  )

  const counter = new CountPerIncidentMessage();

  await pipeline(
    ldbCmd.stdout,
    ldbToMapTransformer,
    counter,
  );

  return counter.counted
}
