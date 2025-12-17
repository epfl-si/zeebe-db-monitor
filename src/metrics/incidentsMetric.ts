// import {client} from "../promClient.js";
//
// import {defaultMetricsRegistry, zeebeMetricsRegistry} from "./index.js";
// import {singleFlightLdbOperations, singleFlightReturn} from "./collector.js";
// import {tallyHistogram} from "../tallyHistogram.js";
//
//
// // Create a histogram of the time to read the INCIDENTS keys-values DB
// export const zeebe_db_incidents_per_message_read_duration_seconds = new client.Histogram({
//   name: 'zeebe_db_incidents_per_message_read_duration_seconds',
//   help: 'Duration to count the INCIDENTS per message entries in ZeebeDB in seconds',
//   labelNames: ["metric_name"]
// })
//
//
// export const zeebeIncidentsPerMessageGauge = new client.Gauge({
//     name: `zeebe_db_column_family_incident_entries`,
//     help: `Number of incidents per errorMessage inside the db`,
//     labelNames: ['db_name', 'error_message'],
//     async collect() {
//       this.reset()  // remove all values from the last iteration
//
//       const ldbResults = await singleFlightLdbOperations.get(8);
//
//       if (ldbResults?.incidentCountPerMessage) {
//         this.set(
//           { db_name: 'runtime', error_message: "allo!!!" }, 22
//         );
//          // set the measure
//         // tallyHistogram(ldbResults.incidentCountPerMessage).forEach((count: number, message: string) => {
//         //   this.set(
//         //     { db_name: 'runtime', error_message: message }, count
//         //   );
//         // })
//       }
//     }
//   })
