import {Request, Response} from "express";
import {metricsRegistry} from "./metrics";
import {ZeebeDB} from "./zeebeDB";
import {snapshotFolderName, snapshotsWorkingDir} from "./folders";
import assert from 'node:assert/strict';
import {columnFamiliesNames} from "./zbColumnFamilies";

const express = require('express');
export const expressApp = express();

// Prometheus metrics route
expressApp.get('/metrics', async (req: Request, res: Response) => {
  // Start the HTTP request timer, saving a reference to the returned method
  const end = metricsRegistry.getSingleMetric('db_read_duration_seconds').startTimer();

  let zdb : ZeebeDB;
  zdb = new ZeebeDB(snapshotsWorkingDir);

  assert.ok(zdb.db.isOperational())

  // Set the mesure on all the column family
  columnFamiliesNames.map(async (columnFamilyName) => {
      let count = 0;
      await zdb.walkColumnFamily(columnFamilyName, function() {
        count++;
      })
      metricsRegistry.getSingleMetric(`db_column_family_entries`).set(
        { db_name: snapshotFolderName, column_family: columnFamilyName }, count
      );
  })

  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());

  // End timer and add labels
  end({ db_name: snapshotFolderName });
});
