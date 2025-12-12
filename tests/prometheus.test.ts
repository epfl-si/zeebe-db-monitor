import request from "supertest";
import {expect} from 'chai';

import {expressApp} from "../src/webServer.js";

describe("Prometheus /metrics endpoint", () => {
  let res: request.Response
  before(async () => {
    res = await request(expressApp).get("/metrics");
  })

  it("should have some metrics in text/plain format", async () => {
    expect(res.status).to.equal(200);
    expect(res.type).to.equal("text/plain");
    expect(res.text).to.include("# HELP"); // Prometheus exposition format
    expect(res.text).to.include("# TYPE");
  });

  it("should have some zeebe metrics about family entries", async () => {
    const interestingFamilyEntries = ['INCIDENTS']
    for (const entry of interestingFamilyEntries) {
      expect(res.text).to.include(
        `zeebe_db_column_family_entries{db_name="runtime",column_family="${ entry }"}`,
        `The column family "${ entry }" is missing from the prometheus metrics`
      );
    }
  });

  it("should have some number of incidents per errorMessage metrics", async () => {
    const interestingErrorMessages = ['INCIDENTS']
    for (const message of interestingErrorMessages) {
      expect(res.text).to.include(
        `zeebe_db_column_family_incident_entries{db_name="runtime",error_message="${ message }"}`,
        `The error message ${ message } is missing from the prometheus metrics`
      );
    }
  });
});
