import {Request, Response} from "express";
import { zeebe_db_read_duration_seconds} from "./metrics";
import rateLimit from 'express-rate-limit'
import {register} from "prom-client";

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
  res.send(await register.metrics());

  // End timer and add labels
  end();
});
