import {columnFamiliesNames} from "./zbColumnFamilies";


const client = require("prom-client");
export const metricsRegistry = new client.Registry();


client.collectDefaultMetrics({
  app: 'zeebe-snapshots-monitor',
  prefix: 'default_metrics_',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register: metricsRegistry
});

// Create a histogram of the time to read the DB
metricsRegistry.registerMetric(
  new client.Histogram({
    name: 'db_read_duration_seconds',
    help: 'Duration to count the entries for all the columnFamilies in ZeebeDB in seconds',
    labelNames: ['db_name'],
  })
);

// Create a gauge for every potential column family
columnFamiliesNames.map((columnFamilyName) => {
  const gauge = new client.Gauge({
    name: `db_counter_${columnFamilyName}`,
    help: `Count the number of ${columnFamilyName} inside the db`,
    labelNames: ['db_name'],
  });
  metricsRegistry.registerMetric(gauge);
})
