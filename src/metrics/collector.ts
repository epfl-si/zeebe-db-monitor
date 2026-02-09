import {SingleFlight} from "../singleFlight.js";
import {zeebe_db_column_families_keys_read_duration_seconds} from "./familiesKeyMetric.js";
import {columnFamiliesCounter, incidentsPerMessageCounter} from "../streams/pipes.js";
import {CountZeebeColumnFamilies, IncidentsPerMessageCount} from "../streams/counter.js";
import {zeebe_db_incidents_per_message_read_duration_seconds} from "./incidentsMetric.js";


const ldbResultsCacheTTL: number = process.env.ZEEBE_DB_MONITOR_LDB_RESULTS_CACHE_TTL ?
  Number(process.env.ZEEBE_DB_MONITOR_LDB_RESULTS_CACHE_TTL) :
  15000

export type singleFlightReturn = Partial<{
  familyCounted: CountZeebeColumnFamilies
  incidentCountPerMessage: IncidentsPerMessageCount
}>

export const singleFlightLdbOperations = new SingleFlight(async () => {
  let result: singleFlightReturn = {}

  // start with the family entries counter
  const endFamilyCounterTimer = zeebe_db_column_families_keys_read_duration_seconds.startTimer()
  result.familyCounted = await columnFamiliesCounter()
  endFamilyCounterTimer();

  // follow with the incidents per message counter
  const endIncidentsTimer = zeebe_db_incidents_per_message_read_duration_seconds.startTimer()

  result.incidentCountPerMessage = await incidentsPerMessageCounter()
  endIncidentsTimer();

  return result
}, ldbResultsCacheTTL);
