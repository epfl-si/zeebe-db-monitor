import dotenv from 'dotenv'
import minimist from 'minimist'

import type {LdbReaderOptions} from "./streams/ldbCmd.js";
import serve from "./webServer.js";
import {exportDbToConsoleAsJSON} from "./streams/pipes.js";

/**
 * Args setup
 */
const args = minimist(process.argv.slice(2));

const isWatcher = args['_'].includes('watch');
const isExporter = args['_'].includes('export');

if (isWatcher && isExporter) {
  console.error("Only run with 'watch' or 'exporter' argument");
  process.exit(1);
}

/**
 * Env config
 */
dotenv.config()

const zeebePartitionPath = process.env.ZEEBE_DB_MONITOR_SNAPSHOT_PATH ??
  (() => {
    throw ("Missing env var ZEEBE_DB_MONITOR_SNAPSHOT_PATH that declare the base path to the db folder, e.g.: ")
  })()

/**
 * Action!
 */
if (isWatcher) {
  await serve();
} else if (isExporter) {
  await exportDbToConsoleAsJSON(
    zeebePartitionPath,
    args as LdbReaderOptions
  );
} else {
  console.error('Only run as watcher or transformer');
  process.exit(1);
}
