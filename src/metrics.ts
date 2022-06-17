import {zdb} from "./zeebeDB";
import {columnFamiliesNames} from "./zbColumnFamilies";

const client = require("prom-client");
export const metricsRegistry = new client.Registry();


client.collectDefaultMetrics({
  app: 'zeebe-snapshots-monitor',
  prefix: '',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register: metricsRegistry
});

// Create a histogram of the time to read the DB
metricsRegistry.registerMetric(
  new client.Histogram({
    name: 'db_read_duration_seconds',
    help: 'Duration to count the entries for all the columnFamilies in ZeebeDB in seconds',
  })
);

// Register column families gauge
metricsRegistry.registerMetric(
  new client.Gauge({
    name: `db_column_family_entries`,
    help: `Number of elements per column families inside the db`,
    labelNames: ['db_name', 'column_family'],
    async collect() {
      // Set the mesure on all the column family
      columnFamiliesNames.map(async (columnFamilyName) => {
        let count: number|undefined;
        await zdb.walkColumnFamily(columnFamilyName, function() {
          !count ? count = 1 : count++;
        })
        if (count) {
          this.set(
            {db_name: 'runtime', column_family: columnFamilyName}, count
          );
        }
      })
    }
  })
);
