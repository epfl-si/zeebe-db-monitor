import {client} from "../promClient.js";

import {singleFlightLdbOperations, singleFlightReturn} from "./collector.js";


// Create a histogram of the time to read all entries DB
export const zeebe_db_column_families_keys_read_duration_seconds = new client.Histogram({
  name: 'zeebe_db_column_families_keys_read_duration_seconds',
  help: 'Duration to count the entries for all the columnFamilies keys in ZeebeDB in seconds',
  labelNames: ["metric_name"]
})

export const zeebeColumnFamiliesGauge = new client.Gauge({
  name: `zeebe_db_column_family_entries`,
  help: `Number of elements per column families inside the db`,
  labelNames: ['db_name', 'column_family'],
  async collect() {
    this.reset()  // remove all values from the last iteration

    const ldbResults = await singleFlightLdbOperations.get(8);

    if (ldbResults?.familyCounted) {
      // Set the metric on all the column family
      Object.keys(ldbResults.familyCounted).forEach((key) => {
        this.set(
          { db_name: 'runtime', column_family: key }, ldbResults!.familyCounted![key]
        )
      })
    }
  }
})
