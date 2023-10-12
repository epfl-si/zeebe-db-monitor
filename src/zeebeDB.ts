import debug_ from "debug";

import { Buffer } from 'node:buffer'
import {Readable} from "stream";

import levelup, {LevelUp} from "levelup";
import RocksDB from "rocksdb";

import {RuntimeDir} from "./folders.js";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies.js";
import {unpackValue} from "./zeebeValue.js";
import {decodeKey, DecodedKeyJobs, DecodedKeyVariables} from "./zeebeKey.js";


const LOG_EVERY_N_READS = 10;

const debug = debug_("zeebeDB") as ReturnType<typeof debug_> & { readCount : number };
debug.readCount = LOG_EVERY_N_READS;

/**
 * @param cfName The column family name as a fully typed-out string, e.g. "PROCESS_CACHE_BY_ID_AND_VERSION".
 *               See zbColumnFamilies.ts for the awaited values
 * @param offset Either 0 or 1. Don't use other numbers :)
 */
const columnFamilyNametoInt64Bytes = (cfName: keyof typeof ZbColumnFamilies, offset: number) => {
  const cfNum = ZbColumnFamilies[cfName]
  return int64ToBytes(cfNum + offset)
}

const int64ToBytes = (i : number) : Uint8Array => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(i))
  return buf
}

export async function ZDB() {
  let lastError : Error | undefined = undefined;
  let runtimeDir : Awaited<ReturnType<typeof RuntimeDir>> | undefined = undefined;
  let zdbInstance: LevelUp<RocksDB> | undefined = undefined;

  for (let i of [1,2]) {
    try {
      runtimeDir = await RuntimeDir();
      zdbInstance = levelup(
        RocksDB(runtimeDir.dir),
        {
          createIfMissing: false,
          readOnly: true
        } );
      break;
    } catch (e : any) {
      if (runtimeDir) await runtimeDir.delete();
      lastError = e;
    }
  }

  if (! zdbInstance ) {
    throw lastError;
  }

  return {
    db: zdbInstance,
    async close() {
      if (zdbInstance) await zdbInstance.close();
      if (runtimeDir) await runtimeDir.delete();
    }
  }
}

export async function walkColumnFamily(
  columnFamilyName: keyof typeof ZbColumnFamilies,
  walkType: 'key'|'keyValue'|'value' = 'key',
  db?: LevelUp<RocksDB>) {

  let close : () => void;
  if (! db) {
    ({close, db} = await ZDB());
  }
  let stream: ReturnType<typeof db.createReadStream>;

  if (walkType === 'keyValue') {
    stream = db.createReadStream({
      gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
      lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
    })
  } else if (walkType === 'value') {
    stream = db.createValueStream({
      gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
      lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
    })
  } else {
    stream = db.createKeyStream({
      gte: columnFamilyNametoInt64Bytes(columnFamilyName, 0),
      lt: columnFamilyNametoInt64Bytes(columnFamilyName, 1),
    })
  }
  if (debug.enabled) {
    stream.on("data", () => {
      if (! debug.readCount--) {
        debug(`Already read ${LOG_EVERY_N_READS} records`);
        debug.readCount = LOG_EVERY_N_READS;
      }
    });
  }
  stream.on("close", () => {
    if (close) {
      debug(`walkColumnFamily: closing DB (and deleting symlinks)`)
      close()
    } else {
      debug(`walkColumnFamily: done (not closing handle)`)
    }
  })

  return Readable.from(stream);
}

/*
 * Get a Map of column families as (columnFamilyName, count)
 * Get only the ones with at least a value
 */
export async function ColumnFamiliesCount() {
  debug("ColumnFamiliesCount(): start");
  const zdb = await ZDB();
  try {
    const columFamiliesCounted = new Map<string, number>()

    for (let columnFamilyName of columnFamiliesNames) {
      let count: number | undefined;

      for await (const row of await walkColumnFamily(columnFamilyName, 'key', zdb.db)) {
        !count ? count = 1 : count++;
      }

      count && columFamiliesCounted.set(columnFamilyName, count)
    }

    debug("ColumnFamiliesCount(): success");
    return columFamiliesCounted
  } catch (e) {
    debug("ColumnFamiliesCount(): error");
    console.error(e)
    // get all or nothing if an error raised
    return new Map<string, number>()
  } finally {
    zdb.close()
  }
}

type jobKey = number;
type jobRecord = { size: number; type: string };
export async function estimateJobSizes() : Promise<{ [k : jobKey] : jobRecord }> {
  debug("estimatedJobSizes(): start");
  const zdb = await ZDB();
  type processInstanceKey = number;
  const jobs : { [k : jobKey] : jobRecord } = {};
  const jobsOfProcessInstance : { [k : processInstanceKey] : jobKey[] } = {}
  try {
      // Bill each process instance with the size of its job:
      for await (const row of await walkColumnFamily('JOBS', 'keyValue', zdb.db)) {
        const key = decodeKey(row.key) as DecodedKeyJobs
        const unpackedValue = unpackValue(row.value)
        const type = unpackedValue?.jobRecord?.type
        if (! type) continue

        const processInstanceKey = unpackedValue?.jobRecord?.processInstanceKey
        if (! processInstanceKey) continue
        jobs[key.jobKey] = { size: row.value.length, type }
        if (! jobsOfProcessInstance[processInstanceKey]) jobsOfProcessInstance[processInstanceKey] = []
        jobsOfProcessInstance[processInstanceKey].push(key.jobKey)
      }

      // Bill each job that uses a given process instance with the cumulated size of their variables:
      for await (const row of await walkColumnFamily('VARIABLES', 'keyValue', zdb.db)) {
        const key = decodeKey(row.key) as DecodedKeyVariables
        for (const k of jobsOfProcessInstance[key.processInstanceKey] || []) {
          jobs[k].size += key.fieldName.length + row.value.length
        }
      }
  } catch (e) {
    debug("estimatedJobSizes(): error");
    console.error(e)
    // In this case, we will return an empty set
  } finally {
    zdb.close()
  }
  return jobs;
}


export async function incidentsMessageCount() {
  try {
    const incidentMessages: string[] = []

    for await (const row of await walkColumnFamily('INCIDENTS', 'keyValue')) {
      const unpackedValue = unpackValue(row.value)
      incidentMessages.push(unpackedValue?.incidentRecord?.errorMessage)
    }

    const incidentCountPerMessage = new Map<string, number>()

    // group by errorMessage and set the mesure
    incidentMessages.forEach((message) => {
      // add to Map
      if (!incidentCountPerMessage.has(message)) incidentCountPerMessage.set(message, 0)
      incidentCountPerMessage.set(message, incidentCountPerMessage.get(message)! +1)
    })

    return incidentCountPerMessage

  } catch (e) {
    console.error(e)
    // get all or nothing if an error raised
    return new Map<string, number>()
  }
}
