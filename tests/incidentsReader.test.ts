import {pipeline} from 'node:stream/promises';
import dotenv from 'dotenv'
import {expect} from "chai";

import {ldbToObjectTransform} from "../src/streams/decoder.js";
import {spawnLDBCommand} from "../src/streams/ldbCmd.js";
import type {LdbReaderOptions} from "../src/streams/ldbCmd.js";

import {CountPerIncidentMessage} from "../src/streams/counter.js";

dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH!

const options = {
  columnFamilyName: 'INCIDENTS',
  keys_only: false,
} as LdbReaderOptions

describe("Incidents key-value counter stream tests", () => {
  it("should group by incident messages and count it", async () => {
    const ldbToMapTransformer = new ldbToObjectTransform(options)

    const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)

    const counter = new CountPerIncidentMessage();

    await pipeline(
      ldbCmd.stdout,
      ldbToMapTransformer,
      counter,
    );

    expect(Object.keys(counter.counted)).to.not.have.lengthOf(
      0,
      `This is worrying that there is no keys as result.` +
      `See counter.counted:  ${JSON.stringify(counter.counted, null, 2)}`
    );
  }).timeout(5000);  // this one may take some time
});
