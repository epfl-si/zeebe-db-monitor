import fs from "node:fs/promises";
import {expect} from "chai";
import dotenv from 'dotenv'

import type {LdbReaderOptions} from "../src/streams/ldbReader.js";
import {exportDbToJsonFile, exportDbToConsoleAsJSON} from "../src/streams/pipes.js";


dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_PARTITION_PATH!

const options = {
  columnFamilyName: 'INCIDENTS',
  limit: 4,
  keys_only: false,
} as LdbReaderOptions

describe('Zeebe Snapshot converting with ldb tests', () => {
  it('should export the DB to a json file', async () => {
    const full_path = '/tmp/zeebe_db_monitor_output_test.json';

    // empty it before continuing
    try {
      const tmp_file = await fs.stat(full_path);
      if (tmp_file.isFile() &&
        tmp_file.size > 0)
        await fs.truncate(full_path);
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e
    }

    await exportDbToJsonFile(
      zeebePartitionPath,
      full_path,
      options
    );

    const stat_file = await fs.stat(full_path);
    expect(stat_file.isFile()).to.be.true;
    expect(stat_file.size).to.not.equal(0);

    // Test if it is a valid JSON for file <300MB
    if (stat_file.size < 302400000) {
      JSON.parse(await fs.readFile(full_path, 'utf8'))
    }
  });

  it('should console.log the DB', async () => {
    await exportDbToConsoleAsJSON(
      zeebePartitionPath,
      options
    );
  });
});
