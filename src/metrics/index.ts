import {client} from "../promClient.js";
import {zeebe_db_column_families_keys_read_duration_seconds, zeebeColumnFamiliesGauge} from "./familiesKeyMetric.js";
//import {zeebe_db_incidents_per_message_read_duration_seconds, zeebeIncidentsPerMessageGauge} from "./incidentsMetric.js";



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
