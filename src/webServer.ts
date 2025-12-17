import {Request, Response} from "express";
import {register} from "prom-client";


import express from "express";
import {defaultMetricsRegistry, zeebeMetricsRegistry} from "./metrics/index.js";
import {singleFlightLdbOperations} from "./metrics/collector.js";
export const expressApp = express();


// Prometheus metrics route
expressApp.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Start the HTTP request timer, saving a reference to the returned method
    res.setHeader('Content-Type', register.contentType);
    // get metrics one after one, that's better for zb
    let metrics: string[] = []
    const pushMetric = (metric : string | undefined) => {
      if (metric) metrics.push(metric)
    }

    await Promise.all([
        zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_entries').then(pushMetric),
        // zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_incident_entries').then(pushMetric),
        defaultMetricsRegistry.metrics().then(pushMetric)
    ]);

    res.send(`${metrics.join('\n\n')}\n`);
  } catch (e) {
    console.error(`Error while getting metrics : ${e}`)   // send it back to console, so we can debug it
    res.status(500)
    res.json({ message: `Error: ${e}`})
  }
});

export default async function serve() {
  // preload first metrics at the app start
  await singleFlightLdbOperations.get(15)

  expressApp.listen(8081, () => console.log('Server metrics are currently exposed on :8081/metrics...'));
}
