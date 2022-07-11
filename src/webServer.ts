import {Request, Response} from "express";
import {
  defaultMetricsRegistry, zeebe_db_read_duration_seconds,
  zeebeMetricsRegistry
} from "./metrics";
import rateLimit from 'express-rate-limit'
import {register} from "prom-client";
import {ZDB} from "./zeebeDB";
import {runtimeDir} from "./folders";

const express = require('express');
export const expressApp = express();

/**
 * Yep, a rate limiter, as a too many db read could be catastrophic for the production
 */
const limiter = rateLimit({
  windowMs: 2 * 1000, // 2 sec
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
expressApp.use(limiter)

// Prometheus metrics route
expressApp.get('/metrics', async (req: Request, res: Response) => {
  // Start the HTTP request timer, saving a reference to the returned method
  const end = zeebe_db_read_duration_seconds.startTimer();
  res.setHeader('Content-Type', register.contentType);

  const zdb = new ZDB(runtimeDir)  // open the db

  try {
    // get metrics one after one, that's better for zb
    let metrics: string[] = ['\n']
    metrics.push(await zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_entries'))
    metrics.push('\n\n')  // gonna add some formatting candy
    metrics.push(await zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_incident_entries'))
    metrics.push('\n')

    res.send(await defaultMetricsRegistry.metrics() + metrics.join());

    // End timer and add labels
    end();
  } catch (e) {
    console.error(e)   // send it back to console, so we can debug it
    res.status(500)
    res.json({ message: `Error: ${e}`})
  } finally {
    await zdb.close()
  }
});
