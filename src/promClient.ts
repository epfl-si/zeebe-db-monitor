/**
 * Same as the “real” `prom-client` from NPM, except
 * that `collect()` won't crash the whole Express process if it throws.
 */

const client_ = require("prom-client");
import { GaugeConfiguration } from "prom-client";

class ExceptionSafeGauge<T extends string> extends client_.Gauge<T> {
  constructor(configuration: GaugeConfiguration<T>) {
    const collectOrig = configuration.collect;
    if (collectOrig) {
      configuration.collect = async function (...params: Parameters<typeof collectOrig>) {
        try {
          return await collectOrig.apply(this, params);
        } catch (e) {
          console.error("Error while collecting prometheus data: ", e);
        }
      }
    }
    super(configuration);
  }
}

export const client = { ...client_, Gauge: ExceptionSafeGauge }
