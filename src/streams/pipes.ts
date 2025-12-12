import fs from "node:fs";
import {pipeline} from "node:stream/promises";

import {LdbReaderOptions, spawnLDBCommand} from "./ldbReader.js";
import {ldbToJSONSTransform} from "./ldbStreamTransformer.js";


/**
 * Fetch the Zeebe partition lines into a file
 */
export const exportDbToJsonFile = async (
  zeebePartitionPath: string,
  outputFilePath: string,
  options?: LdbReaderOptions
) => {
  if (!zeebePartitionPath) throw new Error('Missing a zeebe partition path')

  console.log(`Using ${ outputFilePath } as file output.`)
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
  ldbToJSONSTransformer.on('warn', (err: any) => console.warn(`Warn: ${err}`))

  await pipeline(
    ldbCmd.stdout,
    ldbToJSONSTransformer,
    process.stdout,
  )
}
