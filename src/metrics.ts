import {zdb} from "./zeebeDB";
import {client} from "./promClient";

export const defaultMetricsRegistry = new client.Registry()
export const zeebeMetricsRegistry = new client.Registry()

client.collectDefaultMetrics({
  app: 'zeebe-db-monitor',
  prefix: '',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register: defaultMetricsRegistry,
});

// Create a histogram of the time to read the DB
export const zeebe_db_read_duration_seconds = new client.Histogram({
  name: 'zeebe_db_read_duration_seconds',
  help: 'Duration to count the entries for all the columnFamilies in ZeebeDB in seconds',
})

zeebeMetricsRegistry.registerMetric(
  new client.Gauge({
    name: `zeebe_db_column_family_entries`,
    help: `Number of elements per column families inside the db`,
    labelNames: ['db_name', 'column_family'],
    async collect() {
      this.reset()  // remove all values from last iteration

      // Set the mesure on all the column family
      const columnFamiliesCount = await zdb.memoizedColumnFamiliesCount()

      columnFamiliesCount?.forEach((columnFamilyCount, columnFamiliesName) =>
        this.set(
          { db_name: 'runtime', column_family: columnFamiliesName }, columnFamilyCount
        )
      )
    }
  })
)

zeebeMetricsRegistry.registerMetric(
  new client.Gauge({
    name: `zeebe_db_column_family_incident_entries`,
    help: `Number of incidents per errorMessage inside the db`,
    labelNames: ['db_name', 'error_message'],
    async collect() {
      this.reset()  // remove all values from last iteration

      const incidentCountPerMessage = await zdb.memoizedIncidentsMessageCount()

      //set the measure
      incidentCountPerMessage?.forEach((count, message) => {
        this.set(
          {db_name: 'runtime', error_message: message}, count
        );
      })
    }
  })
)
