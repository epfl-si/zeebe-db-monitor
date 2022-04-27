import RocksDB from "rocksdb";
import Bytes = RocksDB.Bytes;


// same as zeebe/engine/src/main/java/io/camunda/zeebe/engine/state/ZbColumnFamilies.java
enum ZbColumnFamilies {
  DEFAULT,

  // util
  KEY,

  // process
  PROCESS_VERSION,

  // process cache
  PROCESS_CACHE,
  PROCESS_CACHE_BY_ID_AND_VERSION,
  PROCESS_CACHE_DIGEST_BY_ID,

  // element instance
  ELEMENT_INSTANCE_PARENT_CHILD,
  ELEMENT_INSTANCE_KEY,

  NUMBER_OF_TAKEN_SEQUENCE_FLOWS,

  // variable state
  ELEMENT_INSTANCE_CHILD_PARENT,
  VARIABLES,
  TEMPORARY_VARIABLE_STORE,

  // timer state
  TIMERS,
  TIMER_DUE_DATES,

  // pending deployments
  PENDING_DEPLOYMENT,
  DEPLOYMENT_RAW,

  // jobs
  JOBS,
  JOB_STATES,
  JOB_DEADLINES,
  JOB_ACTIVATABLE,

  // message
  MESSAGE_KEY,
  MESSAGES,
  MESSAGE_DEADLINES,
  MESSAGE_IDS,
  MESSAGE_CORRELATED,
  MESSAGE_PROCESSES_ACTIVE_BY_CORRELATION_KEY,
  MESSAGE_PROCESS_INSTANCE_CORRELATION_KEYS,

  // message subscription
  MESSAGE_SUBSCRIPTION_BY_KEY,
  MESSAGE_SUBSCRIPTION_BY_SENT_TIME,
  // migration end
  MESSAGE_SUBSCRIPTION_BY_NAME_AND_CORRELATION_KEY,

  // message start event subscription
  MESSAGE_START_EVENT_SUBSCRIPTION_BY_NAME_AND_KEY,
  MESSAGE_START_EVENT_SUBSCRIPTION_BY_KEY_AND_NAME,

  // process message subscription
  PROCESS_SUBSCRIPTION_BY_KEY,
  // migration start
  PROCESS_SUBSCRIPTION_BY_SENT_TIME,
  // migration end

  // incident
  INCIDENTS,
  INCIDENT_PROCESS_INSTANCES,
  INCIDENT_JOBS,

  // event
  EVENT_SCOPE,
  EVENT_TRIGGER,

  BLACKLIST,

  EXPORTER,

  AWAIT_WORKLOW_RESULT,

  JOB_BACKOFF
}


const isInt64Key = (key: Bytes) => {
  key.readBigInt64LE

  const view = new DataView(key);

  return DataView.prototype.getBigUint64()
  return key === BigUint64Array.new(key)

}

/* Best effort to return the key as String, finding the right decoder if possible*/
export const readKey = (key: Bytes): String =>
{
  // the first pack of char are useless, so try until we get one

  // we can have (as Dom)
  // Tok
  // Int64
  // String

  // we can have ( as typescript)
  //'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex




  if (isInt64Key(key)) {
    return key as Int64Key
  }

  return key as String
}
