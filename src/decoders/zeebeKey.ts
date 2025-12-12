/**
 * Provide utilities to transform Zeebe keys to a readable object
 */

import {TextEncoder, TextDecoder} from 'util';
import * as cFD from "../zbColumnFamiliesTypes.js";
import {columnFamiliesNames} from "../zbColumnFamilies.js";
import {GuessedKey} from "../zbColumnFamiliesTypes.js";


/**
 * From a key as ArrayBuffer, we should be able to return this data
 */
function keyParser (key: string | ArrayBuffer | Buffer) {
  let keyBytes: ArrayBufferLike;

  if (typeof(key) === "string") {
    keyBytes = (new TextEncoder()).encode(key).buffer
  } else if (key instanceof Buffer) {
    keyBytes = key.buffer
  } else {
    keyBytes = key as ArrayBufferLike
  }

  const view = new DataView(keyBytes);
  let offset = 0;

  function peekInt64(opt_max ?: number) {
    if (bytesRemaining() < 8) return

    const num = Number(view.getBigInt64(offset, false));
    return (! opt_max) ? num :
      (num <= opt_max) ? num :
        undefined;  // too big for an int64, it should be something else
  }

  function peekZeebeKey() : number | undefined {
    const zeebeKeyMaybe = peekInt64() as number;
    // all Zeebe keys have bytes 5 and 6 cleared, and something in byte 7
    if ((zeebeKeyMaybe > 2**48) && ((zeebeKeyMaybe % 2**48) < 2**32)) {
      return zeebeKeyMaybe;
    } else {
      return undefined;
    }
  }

  /**
   * Read a zero-terminated string starting at `offset`.
   */
  function peekString () : string | undefined {
    // should have 4 bytes for length, followed by string
    if (bytesRemaining() < 4) return undefined;
    const stringLength = view.getInt32(offset, false);
    if (stringLength > 0 && stringLength <= bytesRemaining()) {
      return (new TextDecoder()).decode(keyBytes.slice(offset + 4, offset + stringLength + 4) as ArrayBuffer);
    } else {
      return undefined;  // The first 32 bits don't look like a string length
    }
  }

  function consume<T> (peeker : (...args : any) => T | undefined, length : (peeked : T) => number) {
    return function(...args : any) {
      const peeked = peeker(...args);
      if (peeked !== undefined) {
        offset += length(peeked);
      }
      return peeked;
    }
  }

  function bytesRemaining() { return keyBytes.byteLength - offset }

  return {
    peekInt64,
    consumeInt64: consume(peekInt64, () => 8),
    peekZeebeKey,
    consumeZeebeKey: consume(peekZeebeKey, () => 8),
    peekString,
    consumeString: consume<string>(peekString, (peeked) => peeked.length + 4),
    bytesRemaining
  }
}

export function decodeKey (
  key: string | ArrayBuffer,
  skipColumnFamilyNames: string[] = []
) {
  const parser = keyParser(key);

  const columnFamily = parser.consumeInt64(/* max_credible = */ 1000) as number;
  const columnFamilyName = columnFamiliesNames[columnFamily];

  if (skipColumnFamilyNames.includes(columnFamilyName)) return

  if (columnFamilyName === "NUMBER_OF_TAKEN_SEQUENCE_FLOWS") {
    const keyStruct = {
      family: columnFamilyName,
      processInstanceKey: parser.consumeZeebeKey()!,
      elements: []
    } as cFD.NumberOfTakenSequenceFlowsDecodedKey;

    while (undefined !== parser.peekString()) {
      keyStruct.elements.push(parser.consumeString()!);
    }

    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing NUMBER_OF_TAKEN_SEQUENCE_FLOWS key, ${parser.bytesRemaining()} bytes remaining`);
    }

    return keyStruct;
  } else if (columnFamilyName === 'DEFAULT') {
    return {
      family: columnFamilyName,
      name: parser.consumeString()!
    } as cFD.Default
  } else if (columnFamilyName === 'KEY') {
    return {
      family: columnFamilyName,
      name: parser.consumeString()!
    } as cFD.Key
  } else if (columnFamilyName === 'ELEMENT_INSTANCE_PARENT_CHILD') {
    return {
      family: columnFamilyName,
      parent: parser.consumeZeebeKey()!,
      child: parser.consumeZeebeKey()!
    } as cFD.ElementInstanceParentChild
  } else if (columnFamilyName === 'VARIABLES') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
      variableName: parser.consumeString()!,
    } as cFD.Variable
  } else if (columnFamilyName === 'PROCESS_SUBSCRIPTION_BY_KEY') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
      unknownString: parser.consumeString()!,
      processName: parser.consumeString()!,
    } as cFD.ProcessSubscriptionByKey
  } else if (columnFamilyName === 'MESSAGE_SUBSCRIPTION_BY_NAME_AND_CORRELATION_KEY') {
    return {
      family: columnFamilyName,
      unknownString: parser.consumeString()!,
      messageName: parser.consumeString()!,
      UUID: parser.consumeString()!,
      key: parser.consumeZeebeKey()!,
    } as cFD.MessageSubscriptionByNameAndCorrelationKey
  } else if (columnFamilyName === 'PROCESS_INSTANCE_KEY_BY_DEFINITION_KEY') {
    return {
      family: columnFamilyName,
      key1: parser.consumeZeebeKey()!,
      key2: parser.consumeZeebeKey()!,
    } as cFD.ProcessInstanceKeyByDefinitionKey
  } else if (columnFamilyName === 'EVENT_SCOPE') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!
    } as cFD.EventScope
  } else if (columnFamilyName === 'INCIDENT_PROCESS_INSTANCES') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!
    } as cFD.IncidentProcessInstances
  } else if (columnFamilyName === 'INCIDENT_JOBS') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!
    } as cFD.IncidentJobs
  } else if (columnFamilyName === 'INCIDENTS') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!
    } as cFD.Incidents
  } else if (columnFamilyName === 'MESSAGE_SUBSCRIPTION_BY_KEY') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
      value: parser.consumeString()!
    } as cFD.MessageSubscriptionByKey
  } else if (columnFamilyName === 'JOBS') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
    } as cFD.Jobs
  } else if (columnFamilyName === 'JOB_STATES') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
    } as cFD.JobStates
  } else if (columnFamilyName === 'JOB_DEADLINES') {
    return {
      family: columnFamilyName,
      unknownInt64: parser.consumeInt64()!,
      key: parser.consumeZeebeKey()!,
    } as cFD.JobDeadlines
  } else if (columnFamilyName === 'ELEMENT_INSTANCE_CHILD_PARENT') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
    } as cFD.ElementInstanceChildParent
  } else if (columnFamilyName === 'ELEMENT_INSTANCE_KEY') {
    return {
      family: columnFamilyName,
      key: parser.consumeZeebeKey()!,
    } as cFD.ElementInstanceKey
  } else if (columnFamilyName === 'PROCESS_CACHE_BY_ID_AND_VERSION') {
    return {
      family: columnFamilyName,
      unknownString1: parser.consumeString(),
      unknownString2: parser.consumeString(),
      unknownInt64: parser.consumeInt64(),
    } as cFD.ProcessCacheByIdAndVersion
  } else if (columnFamilyName === 'PROCESS_VERSION') {
    return {
      family: columnFamilyName,
      unknownString1: parser.consumeString(),
      unknownString2: parser.consumeString(),
    } as cFD.ProcessVersion
  } else if (columnFamilyName === 'PROCESS_CACHE') {
    return {
      family: columnFamilyName,
      unknownString: parser.consumeString(),
      key: parser.peekZeebeKey(),
    } as cFD.ProcessCache
  } else if (columnFamilyName === 'EXPORTER') {
    return {
      family: columnFamilyName,
      name: parser.consumeString(),
    } as cFD.Exporter
  } else {
    // Not a known family, try a guess then
    const guessedKey = guessDecodeKey(key)
    throw new Error(`
      The column family ${columnFamilyName} has no decoder.
      Guessed key: ${ JSON.stringify(guessedKey) }
    `);
  }
}

function guessDecodeKey (key: string | ArrayBuffer | Buffer) {
  const parser = keyParser(key);

  let ret: GuessedKey = [
    // consume Column Family ID first
    {
      type: 'columnFamilyId',
      value: parser.consumeInt64(
      1000  // max_credible
      ) as number
    }
  ]

  while (parser.bytesRemaining() > 0) {
    if (parser.peekZeebeKey() !== undefined) {
      ret.push({ type: "key", value: parser.consumeZeebeKey()! });
    } else if (parser.peekString() !== undefined) {
      ret.push({ type: "string", value: parser.consumeString()! });
    } else if (parser.peekInt64() !== undefined) {
      ret.push({ type: "int64", value: parser.consumeInt64()! });
    } else {
      throw new Error(`Unknown key part ${ key }. ${ parser.bytesRemaining() } bytes remaining. Parsed so far ${ JSON.stringify(ret) }`);
    }
  }
  return ret;
}
