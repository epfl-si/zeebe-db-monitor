import {ColumnFamiliesCount, incidentsMessageCount} from "./zeebeDB.js";
import {client} from "./promClient.js";
import {tallyHistogram} from "./tallyHistogram.js";

export const defaultMetricsRegistry = new client.Registry()
export const zeebeMetricsRegistry = new client.Registry()

client.collectDefaultMetrics({
  register: defaultMetricsRegistry,
  prefix: '',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Create a histogram of the time to read the DB
export const zeebe_db_read_duration_seconds = new client.Histogram({
  name: 'zeebe_db_read_duration_seconds',
  help: 'Duration to count the entries for all the columnFamilies in ZeebeDB in seconds',
  labelNames: ["metric_name"]
})

defaultMetricsRegistry.registerMetric(zeebe_db_read_duration_seconds)

zeebeMetricsRegistry.registerMetric(
  new client.Gauge({
    name: `zeebe_db_column_family_entries`,
    help: `Number of elements per column families inside the db`,
    labelNames: ['db_name', 'column_family'],
    async collect() {
      this.reset()  // remove all values from last iteration

      // Set the mesure on all the column family
      const columnFamiliesCount = await ColumnFamiliesCount()

      columnFamiliesCount?.forEach((columnFamilyCount: number, columnFamiliesName: string) =>
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

      const incidentCountPerMessage = await incidentsMessageCount()

      //set the measure
      tallyHistogram(incidentCountPerMessage).forEach((count: number, message: string) => {
        this.set(
          {db_name: 'runtime', error_message: message}, count
        );
      })
    }
  })
)
