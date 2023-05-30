import debug_ from "debug";

import RocksDB from "rocksdb";
import levelup, {LevelUp} from "levelup";
import {columnFamiliesNames, ZbColumnFamilies} from "./zbColumnFamilies.js";
import { Buffer } from 'node:buffer'
import {unpack} from "msgpackr";
import {Readable} from "stream";
import {RuntimeDir} from "./folders.js";


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


export async function incidentsMessageCount() {
  try {
    const incidentMessages: string[] = []

    for await (const row of await walkColumnFamily('INCIDENTS', 'keyValue')) {
      const unpackedValue = unpack(row.value)
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
