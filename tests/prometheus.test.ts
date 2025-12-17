import request from "supertest";
import {expect} from 'chai';

import {expressApp} from "../src/webServer.js";


/**
 * Try to poll /metrics until we get some values from Ldb
 */
async function waitForLdbMetrics(
  text_to_wait: string,
  {
    timeoutMs = 5000,
    intervalMs = 100
  } = {}
) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await request(expressApp).get("/metrics");

    if (res.text.includes(text_to_wait)) {
      return res;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error("Timed out waiting for metrics");
}

describe("Prometheus /metrics endpoint", () => {
  let res: request.Response

  before(async () => {
    res = await waitForLdbMetrics('zeebe_db_column_family_entries{db_name="runtime",column_family=')
  })

  it("should have some metrics in text/plain format", async () => {
    expect(res.status).to.equal(200);
    expect(res.type).to.equal("text/plain");
    expect(res.text).to.include("# HELP"); // Prometheus exposition format
    expect(res.text).to.include("# TYPE");
  });

  it("should have some zeebe metrics about family entries", async () => {
    const interestingFamilyEntries = ['INCIDENTS', 'JOBS', 'PROCESS_VERSION']

    for (const entry of interestingFamilyEntries) {
      expect(res.text).to.include(
        `zeebe_db_column_family_entries{db_name="runtime",column_family="${ entry }"}`,
        `The column family "${ entry }" is missing from the prometheus metrics`
      );
    }

    expect(res.text).to.include(
      `zeebe_db_column_families_keys_read_duration_seconds_sum`,
      `The metric about fetch time onthe column family entries is missign from the prometheus metrics`
    );
  });

  // it("should have some number of incidents per errorMessage metrics", async () => {
  //   const interestingErrorMessages = ['INCIDENTS']
  //   for (const message of interestingErrorMessages) {
  //     expect(res.text).to.include(
  //       `zeebe_db_column_family_incident_entries{db_name="runtime",error_message="${ message }"}`,
  //       `The error message ${ message } is missing from the prometheus metrics`
  //     );
  //   }
  // });
});
