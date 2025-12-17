import fs from "node:fs/promises";
import {expect} from "chai";
import dotenv from 'dotenv'

import type {LdbReaderOptions} from "../src/streams/ldbCmd.js";
import {exportDbToJsonFile} from "../src/streams/pipes.js";


dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH!

const options = {
  columnFamilyName: 'INCIDENTS',
  limit: 25,
  keys_only: false,
} as LdbReaderOptions

describe('Snapshot exporting with ldb', () => {
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

    // cleanup
    await fs.unlink(full_path);
  });
});
