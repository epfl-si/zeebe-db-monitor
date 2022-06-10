import {Request, Response} from "express";
import { metricsRegistry } from "./metrics";

const express = require('express');
export const expressApp = express();

// Prometheus metrics route
expressApp.get('/metrics', async (req: Request, res: Response) => {
  // Start the HTTP request timer, saving a reference to the returned method
  const end = metricsRegistry.getSingleMetric('db_read_duration_seconds').startTimer();

  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());

  // End timer and add labels
  end();
});
