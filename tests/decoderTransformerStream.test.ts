import {pipeline} from 'node:stream/promises';
import dotenv from 'dotenv'
import {expect} from "chai";

import {ldbToObjectTransform} from "../src/streams/decoder.js";
import {spawnLDBCommand} from "../src/streams/ldbCmd.js";
import {CaptureObjectStream} from "../src/streams/writables.js";
import type {LdbReaderOptions} from "../src/streams/ldbCmd.js";

dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH!

const options = {
  limit: 100,
  keys_only: false,
} as LdbReaderOptions

describe("ldb output to key-value transformer tests", () => {
  it("should transform encoded ldb lines into a decoded keys-values map", async () => {
    const ldbToMapTransformer = new ldbToObjectTransform(options)
    if (
      process.env.ZEEBE_DB_MONITOR_DECODER_SHOW_WARNING_IN_CONSOLE &&
      process.env.ZEEBE_DB_MONITOR_DECODER_SHOW_WARNING_IN_CONSOLE == "true"
    ) {
      ldbToMapTransformer.on('warn', (err: any) => console.log(`Warn: ${err}`))
    }

    const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)

    const capture = new CaptureObjectStream();

    await pipeline(
      ldbCmd.stdout,
      ldbToMapTransformer,
      capture,
    )

    expect(capture.data).to.not.have.lengthOf(0);
    capture.data.forEach(data => {
      expect(data).to.have.property('key');
      expect(data).to.have.property('value');
    })

    // uncomment for logs
    // console.log(
    //   util.inspect(
    //     capture.data,
    //     { showHidden: false, depth: null, colors: true }
    //   )
    // );
  });
});
