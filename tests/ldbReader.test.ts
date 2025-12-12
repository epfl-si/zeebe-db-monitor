import {expect} from "chai";
import {pipeline} from "node:stream/promises";

import {CaptureTextStream} from "../src/streams/writables.js";
import {spawnLDBCommand} from "../src/streams/ldbReader.js";
import type {LdbReaderOptions} from "../src/streams/ldbReader.js";

import dotenv from 'dotenv'


dotenv.config()
const zeebePartitionPath = process.env.ZEEBE_PARTITION_PATH!

const options = {
  columnFamilyName: 'INCIDENTS',
  limit: 4,
  keys_only: false,
  // skipColumnFamilyNames: [
  //   'INCIDENTS',
  //   'INCIDENT_PROCESS_INSTANCES',
  //   'INCIDENT_JOBS',
  //   'VARIABLES',
  //   'JOBS',
  //   'JOB_STATES',
  //   'JOB_DEADLINES',
  //   'ELEMENT_INSTANCE_KEY',
  //   'NUMBER_OF_TAKEN_SEQUENCE_FLOWS',
  //   'ELEMENT_INSTANCE_PARENT_CHILD',
  //   'ELEMENT_INSTANCE_CHILD_PARENT',
  //   'PROCESS_SUBSCRIPTION_BY_KEY',
  //   'MESSAGE_SUBSCRIPTION_BY_NAME_AND_CORRELATION_KEY',
  //   'EVENT_SCOPE',
  //   'PROCESS_CACHE',
  //   'PROCESS_CACHE_BY_ID_AND_VERSION',
  //   'PROCESS_INSTANCE_KEY_BY_DEFINITION_KEY',
  //   'MESSAGE_SUBSCRIPTION_BY_KEY',
  // ],
} as LdbReaderOptions

describe('LDB command line tester', () => {
  let last_captured_stream_output: string

  after(() => {
    // uncomment if you want to look at the last test output
    //console.log(last_captured_stream_output);
  })

  it('should be able to read the ldb stream', async () => {
    const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)
    const capture = new CaptureTextStream();

    await pipeline(
      ldbCmd.stdout,
      capture
    );

    expect(capture.data).to.be.a('string');
    expect(capture.data).to.contain('==>');
    last_captured_stream_output = capture.data
  });

  it('should have key only', async () => {
    const ldbCmd= spawnLDBCommand(
      zeebePartitionPath,
      { ...options, keys_only: true }
    )

    const capture = new CaptureTextStream();

    await pipeline(
      ldbCmd.stdout,
      capture
    );
    expect(capture.data).to.not.contain('==>');
    last_captured_stream_output = capture.data
  });

  it('should have key and values', async () => {
    const ldbCmd = spawnLDBCommand(zeebePartitionPath, options)
    const capture = new CaptureTextStream();

    await pipeline(
      ldbCmd.stdout,
      capture
    );

    expect(capture.data).to.contain('==>');
    last_captured_stream_output = capture.data
  });
});

//
// describe('snapshots data reading tests', async () => {
//   describe('Zeebe DB reading with ldb', async () => {
//
//      await it('should export the DB to a json file', async () => {
//       const full_path = '/tmp/zeebe_db_monitor_output_test.json';
//
//       // empty it before continuing
//       try {
//         const tmp_file = await fs.stat(full_path);
//         if (tmp_file.isFile() &&
//           tmp_file.size > 0)
//           await fs.truncate(full_path);
//       } catch (e: any) {
//         if (e.code !== 'ENOENT') throw e
//       }
//
//       await exportDbToJson(
//         zeebePartitionPath,
//         full_path,
//         options
//       );
//
//       const stat_file = await fs.stat(full_path);
//       assert.ok(stat_file.isFile());
//       assert.notEqual(stat_file.size, 0);
//       // Test if it is a valid JSON for file <300MB
//        if (stat_file.size < 302400000) {
//          JSON.parse(await fs.readFile(full_path, 'utf8'))
//        }
//     });
//
//     await it('should console.log the DB', async () => {
//       await zeebeDbToConsole(
//         zeebePartitionPath,
//         options
//       )
//     });
//   });
// });
