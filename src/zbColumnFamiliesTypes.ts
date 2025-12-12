
/**********
 Types definition of the column families
 */

export type DecodedKey = {
  family: string
}

export type GuessedKey = {
  type: string,
  value: ( number | string )
}[]

export type NumberOfTakenSequenceFlowsDecodedKey = DecodedKey & {
  processInstanceKey: number
  elements: string[]
}

export type Default = DecodedKey & {
  name: string
}

export type Key = DecodedKey & {
  name: string
}

export type ElementInstanceParentChild = DecodedKey & {
  parent: number
  child: number
}

export type Variable = DecodedKey & {
  key: number
  variableName: string
}

export type ProcessSubscriptionByKey = DecodedKey & {
  key: number
  unknownString: string
  processName: string
}

export type MessageSubscriptionByNameAndCorrelationKey = DecodedKey & {
  unknownString: string
  messageName: string
  UUID: string
  key: number
}

export type ProcessInstanceKeyByDefinitionKey = DecodedKey & {
  key1: number
  key2: number
}

export type EventScope = DecodedKey & {
  key: number
}

export type IncidentProcessInstances = DecodedKey & {
  key: number
}

export type IncidentJobs = DecodedKey & {
  key: number
}

export type Incidents = DecodedKey & {
  key: number
}

export type MessageSubscriptionByKey = DecodedKey & {
  key: number
  value: string
}

export type Jobs = DecodedKey & {
  key: number
}

export type JobStates= DecodedKey & {
  key: number
}

export type JobDeadlines= DecodedKey & {
  unknownInt64: number
  key: number
}

export type ElementInstanceChildParent= DecodedKey & {
  key: number
}

export type ElementInstanceKey = DecodedKey & {
  key: number
}

export type ProcessCacheByIdAndVersion = DecodedKey & {
  unknownString1: string
  unknownString2: string
  unknownInt64: number
}

export type ProcessVersion = DecodedKey & {
  unknownString1: string
  unknownString2: string
}

export type ProcessCache = DecodedKey & {
  unknownString: string
  key: number
}

export type Exporter = DecodedKey & {
  name: string
}

