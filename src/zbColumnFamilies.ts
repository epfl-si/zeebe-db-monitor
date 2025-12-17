// same as camunda/camunda/blob/8.5.17/zeebe/protocol/src/main/java/io/camunda/zeebe/protocol/ZbColumnFamilies.java
export enum ZbColumnFamilies {
  DEFAULT = 0,

  // util
  KEY = 1,

  // process
  // deprecated
  DEPRECATED_PROCESS_VERSION = 2,

  // process cache
  // deprecated
  DEPRECATED_PROCESS_CACHE = 3,
  // deprecated
  DEPRECATED_PROCESS_CACHE_BY_ID_AND_VERSION = 4,
  // deprecated
  DEPRECATED_PROCESS_CACHE_DIGEST_BY_ID = 5,

  // element instance
  ELEMENT_INSTANCE_PARENT_CHILD = 6,
  ELEMENT_INSTANCE_KEY = 7,

  NUMBER_OF_TAKEN_SEQUENCE_FLOWS = 8,

  // variable state
  ELEMENT_INSTANCE_CHILD_PARENT = 9,
  VARIABLES = 10,
  // deprecated
  TEMPORARY_VARIABLE_STORE = 11,

  // timer state
  TIMERS = 12,
  TIMER_DUE_DATES = 13,

  // pending deployments
  PENDING_DEPLOYMENT = 14,
  DEPLOYMENT_RAW = 15,

  // jobs
  JOBS = 16,
  JOB_STATES = 17,
  JOB_DEADLINES = 18,
  // deprecated
  DEPRECATED_JOB_ACTIVATABLE = 19,

  // message
  MESSAGE_KEY = 20,
  // deprecated
  DEPRECATED_MESSAGES = 21,
  MESSAGE_DEADLINES = 22,
  MESSAGE_IDS = 23,
  MESSAGE_CORRELATED = 24,
  MESSAGE_PROCESSES_ACTIVE_BY_CORRELATION_KEY = 25,
  MESSAGE_PROCESS_INSTANCE_CORRELATION_KEYS = 26,

  // message subscription
  MESSAGE_SUBSCRIPTION_BY_KEY = 27,
  // deprecated Only used for migration logic
  MESSAGE_SUBSCRIPTION_BY_SENT_TIME = 28,
  // deprecated
  DEPRECATED_MESSAGE_SUBSCRIPTION_BY_NAME_AND_CORRELATION_KEY = 29,

  // message start event subscription
  // deprecated
  DEPRECATED_MESSAGE_START_EVENT_SUBSCRIPTION_BY_NAME_AND_KEY = 30,
  // deprecated
  DEPRECATED_MESSAGE_START_EVENT_SUBSCRIPTION_BY_KEY_AND_NAME = 31,

  // process message subscription
  // deprecated
  DEPRECATED_PROCESS_SUBSCRIPTION_BY_KEY = 32,
  // deprecated Only used for migration logic
  PROCESS_SUBSCRIPTION_BY_SENT_TIME = 33,

  // incident
  INCIDENTS = 34,
  INCIDENT_PROCESS_INSTANCES = 35,
  INCIDENT_JOBS = 36,

  // event
  EVENT_SCOPE = 37,
  EVENT_TRIGGER = 38,

  BANNED_INSTANCE = 39,

  EXPORTER = 40,

  AWAIT_WORKLOW_RESULT = 41,

  JOB_BACKOFF = 42,

  // deprecated
  DEPRECATED_DMN_DECISIONS = 43,
  // deprecated
  DEPRECATED_DMN_DECISION_REQUIREMENTS = 44,
  // deprecated
  DEPRECATED_DMN_LATEST_DECISION_BY_ID = 45,
  // deprecated
  DEPRECATED_DMN_LATEST_DECISION_REQUIREMENTS_BY_ID = 46,
  // deprecated
  DEPRECATED_DMN_DECISION_KEY_BY_DECISION_REQUIREMENTS_KEY = 47,
  // deprecated
  DEPRECATED_DMN_DECISION_KEY_BY_DECISION_ID_AND_VERSION = 48,
  // deprecated
  DEPRECATED_DMN_DECISION_REQUIREMENTS_KEY_BY_DECISION_REQUIREMENT_ID_AND_VERSION = 49,

  // signal subscription
  // deprecated
  DEPRECATED_SIGNAL_SUBSCRIPTION_BY_NAME_AND_KEY = 50,
  // deprecated
  DEPRECATED_SIGNAL_SUBSCRIPTION_BY_KEY_AND_NAME = 51,

  // distribution
  PENDING_DISTRIBUTION = 52,
  COMMAND_DISTRIBUTION_RECORD = 53,
  MESSAGE_STATS = 54,

  PROCESS_INSTANCE_KEY_BY_DEFINITION_KEY = 55,

  MIGRATIONS_STATE = 56,

  PROCESS_VERSION = 57,
  PROCESS_CACHE = 58,
  PROCESS_CACHE_BY_ID_AND_VERSION = 59,
  PROCESS_CACHE_DIGEST_BY_ID = 60,

  DMN_DECISIONS = 61,
  DMN_DECISION_REQUIREMENTS = 62,
  DMN_LATEST_DECISION_BY_ID = 63,
  DMN_LATEST_DECISION_REQUIREMENTS_BY_ID = 64,
  DMN_DECISION_KEY_BY_DECISION_REQUIREMENTS_KEY = 65,
  DMN_DECISION_KEY_BY_DECISION_ID_AND_VERSION = 66,
  DMN_DECISION_REQUIREMENTS_KEY_BY_DECISION_REQUIREMENT_ID_AND_VERSION = 67,

  FORMS = 68,
  FORM_VERSION = 69,
  FORM_BY_ID_AND_VERSION = 70,

  MESSAGES = 71,
  MESSAGE_START_EVENT_SUBSCRIPTION_BY_NAME_AND_KEY = 72,
  MESSAGE_START_EVENT_SUBSCRIPTION_BY_KEY_AND_NAME = 73,
  MESSAGE_SUBSCRIPTION_BY_NAME_AND_CORRELATION_KEY = 74,
  PROCESS_SUBSCRIPTION_BY_KEY = 75,

  JOB_ACTIVATABLE = 76,

  SIGNAL_SUBSCRIPTION_BY_NAME_AND_KEY = 77,
  SIGNAL_SUBSCRIPTION_BY_KEY_AND_NAME = 78,

  USER_TASKS = 79,
  USER_TASK_STATES = 80,
  COMPENSATION_SUBSCRIPTION = 81
}

// utility to transform the enum into a list
export const columnFamiliesNames = Object.entries(ZbColumnFamilies).filter(
  (entry) => !isNaN(Number(entry[1]))
).map(
  entry => entry[0] as keyof typeof ZbColumnFamilies
)

const int64ToBytes = (i : number) : Uint8Array => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(i))
  return buf
}

/**
 * @param cfName The column family name as a fully typed-out string, e.g. "PROCESS_CACHE_BY_ID_AND_VERSION".
 *               See zbColumnFamilies.ts for the awaited values
 * @param offset Either 0 or 1. Don't use other numbers :)
 */
export const columnFamilyNametoInt64Bytes = (cfName: keyof typeof ZbColumnFamilies, offset: number) => {
  const cfNum = ZbColumnFamilies[cfName]
  return int64ToBytes(cfNum + offset)
}
