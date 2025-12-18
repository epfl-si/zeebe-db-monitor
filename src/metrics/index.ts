import {client} from "../promClient.js";
import {zeebe_db_column_families_keys_read_duration_seconds, zeebeColumnFamiliesGauge} from "./familiesKeyMetric.js";
//import {zeebe_db_incidents_per_message_read_duration_seconds, zeebeIncidentsPerMessageGauge} from "./incidentsMetric.js";

export const bucketForLdbOperations = [
  0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5, 7
]

export const defaultMetricsRegistry = new client.Registry()
export const zeebeMetricsRegistry = new client.Registry()

client.collectDefaultMetrics({
  register: defaultMetricsRegistry,
  prefix: '',
});

defaultMetricsRegistry.registerMetric(zeebe_db_column_families_keys_read_duration_seconds)
// defaultMetricsRegistry.registerMetric(zeebe_db_incidents_per_message_read_duration_seconds)

zeebeMetricsRegistry.registerMetric(zeebeColumnFamiliesGauge)
//zeebeMetricsRegistry.registerMetric(zeebeIncidentsPerMessageGauge)
