import {initDBReader, walkColumnFamily, zdb} from "./zeebeDB";
import {columnFamiliesNames} from "./zbColumnFamilies";
import {runtimeDir} from "./folders";

const client = require("prom-client");

client.collectDefaultMetrics({
  app: 'zeebe-db-monitor',
  prefix: '',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Create a histogram of the time to read the DB
export const zeebe_db_read_duration_seconds = new client.Histogram({
    name: 'zeebe_db_read_duration_seconds',
    help: 'Duration to count the entries for all the columnFamilies in ZeebeDB in seconds',
})

new client.Gauge({
  name: `zeebe_db_column_family_entries`,
  help: `Number of elements per column families inside the db`,
  labelNames: ['db_name', 'column_family'],
  async collect() {
    this.reset()  // remove all values from last iteration
    // Set the mesure on all the column family
    if (!zdb) await initDBReader(runtimeDir)

    for (let columnFamilyName of columnFamiliesNames) {
      let count: number|undefined;
      await walkColumnFamily(zdb!, columnFamilyName, function() {
        !count ? count = 1 : count++;
      })
      if (count) {
        this.set(
          {db_name: 'runtime', column_family: columnFamilyName}, count
        );
      }
    }
  }
})
