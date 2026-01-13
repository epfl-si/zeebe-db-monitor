import {pipeline} from 'node:stream/promises';
import dotenv from 'dotenv'
import {expect} from "chai";

import {ldbToObjectTransform} from "../src/streams/decoder.js";
import {spawnLDBCommand} from "../src/streams/ldbCmd.js";
import type {LdbReaderOptions} from "../src/streams/ldbCmd.js";

import {CountByFamilyName} from "../src/streams/counter.js";

dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH!

const options = {
  keys_only: true,
} as LdbReaderOptions

describe("Counter stream tests", () => {
  it("should group by column family name and count the number of each entry", async () => {
    const ldbToMapTransformer = new ldbToObjectTransform(options)

    const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)

    const counter = new CountByFamilyName();

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

  it("should group by family name and count the number of one family (JOBS) ", async () => {
    const ldbToMapTransformer = new ldbToObjectTransform(options)

    const ldbCmd = spawnLDBCommand(
      zeebePartitionPath,
      {
        columnFamilyName: 'JOBS',
        keys_only: true,
      },
    )

    const counter = new CountByFamilyName();

    await pipeline(
      ldbCmd.stdout,
      ldbToMapTransformer,
      counter,
    );

    expect(Object.keys(counter.counted)[0]).to.be.equal('JOBS');
    expect(counter.counted.JOBS).to.be.greaterThan(0);
  });
});
