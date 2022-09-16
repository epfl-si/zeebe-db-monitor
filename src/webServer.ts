import {Request, Response} from "express";
import {
  defaultMetricsRegistry, zeebe_db_read_duration_seconds,
  zeebeMetricsRegistry
} from "./metrics.js";
import rateLimit from 'express-rate-limit'
import {register} from "prom-client";
import {closeDB} from "./zeebeDB.js";

import express from "express";
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
  try {
    // Start the HTTP request timer, saving a reference to the returned method
    const end = zeebe_db_read_duration_seconds.startTimer();
    res.setHeader('Content-Type', register.contentType);
    // get metrics one after one, that's better for zb
    let metrics: string[] = []
    metrics.push(await defaultMetricsRegistry.metrics())
    metrics.push(await zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_entries'))
    metrics.push(await zeebeMetricsRegistry.getSingleMetricAsString('zeebe_db_column_family_incident_entries'))

    res.send(`${metrics.join('\n\n')}\n`);

    // End timer and add labels
    end();
  } catch (e) {
    console.error(`Error while getting metrics : ${e}`)   // send it back to console, so we can debug it
    res.status(500)
    res.json({ message: `Error: ${e}`})
  } finally {
    await closeDB()
  }
});
