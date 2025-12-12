import {pipeline} from 'node:stream/promises';
import {spawn} from "node:child_process";
import * as util from "node:util";
import dotenv from 'dotenv'
import {expect} from "chai";

import {ldbToKeyValueTransform} from "../src/streams/ldbStreamTransformer.js";
import {spawnLDBCommand} from "../src/streams/ldbReader.js";
import type {LdbReaderOptions} from "../src/streams/ldbReader.js";
import {CaptureObjectStream} from "../src/streams/writables.js";

dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_PARTITION_PATH!

const options = {
  columnFamilyName: "INCIDENTS",
  limit: 10,
  keys_only: false,
} as LdbReaderOptions

describe("ldb to key-value transformer tests", () => {
  it("should transform encoded ldb lines into a decoded keys-values map", async () => {
    const ldbToMapTransformer = new ldbToKeyValueTransform(options)
    ldbToMapTransformer.on('warn', err => console.log(`Warn: ${err}`))

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

    console.log(
      util.inspect(
        capture.data,
        { showHidden: false, depth: null, colors: true }
      )
    );
  });
});
