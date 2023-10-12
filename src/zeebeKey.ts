/**
 * Provide utilities to transform Zeebe keys to a readable object
 */

import {TextEncoder, TextDecoder} from 'util';
import {columnFamiliesNames} from "./zbColumnFamilies.js";

type zeebeKey = number

function keyParser (key: string | ArrayBuffer | Buffer) {
  let keyBytes: ArrayBufferLike;

  if (typeof(key) === "string") {
    keyBytes = (new TextEncoder()).encode(key).buffer
  } else if (key instanceof Buffer) {
    keyBytes = key.buffer
  } else {
    keyBytes = key
  }

  const view = new DataView(keyBytes);
  let offset = 0;

  function peekInt64(opt_max ?: number) {
    const num = Number(view.getBigInt64(offset, false));
    return (! opt_max) ? num :
      (num <= opt_max) ? num :
        undefined;
  }

  function peekZeebeKey() : number | undefined {
    const zeebeKeyMaybe = peekInt64() as number;
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
    if (bytesRemaining() < 4) return undefined;
    const stringLength = view.getInt32(offset, false);
    if (stringLength > 0 && stringLength <= bytesRemaining()) {
      return (new TextDecoder()).decode(keyBytes.slice(offset + 4, offset + stringLength + 4));
    } else {
      return undefined;  // First 32 bits don't look like a string length
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
    consumeZeebeKey: consume<zeebeKey>(peekZeebeKey, () => 8),
    peekString,
    consumeString: consume<string>(peekString, (peeked) => peeked.length + 4),
    bytesRemaining
  }
}

/**
 * From a key as ArrayBuffer, we should be able to return some data
 */
type DecodedKey = {
  family: string
}

export type DecodedKeyNumberOfTakenSequenceFlows = DecodedKey & {
  processInstanceKey: zeebeKey
  elements: string[]
}

export type DecodedKeyIncidents = DecodedKey & {
  incidentKey: zeebeKey
}

export type DecodedKeyVariables = DecodedKey & {
  processInstanceKey: zeebeKey
  fieldName: string
}

export type DecodedKeyJobs = DecodedKey & {
  jobKey: zeebeKey
}

export function decodeKey (key: string | ArrayBuffer) {
  const parser = keyParser(key);

  const columnFamily = parser.consumeInt64(/* max_credible = */ 1000) as number;
  const columnFamilyName = columnFamiliesNames[columnFamily];
  const keyStruct : DecodedKey = {
    family: columnFamilyName
  };

  if (columnFamilyName === "NUMBER_OF_TAKEN_SEQUENCE_FLOWS") {
    (keyStruct as DecodedKeyNumberOfTakenSequenceFlows).processInstanceKey = parser.consumeZeebeKey()!;
    (keyStruct as DecodedKeyNumberOfTakenSequenceFlows).elements = [];
    while (undefined !== parser.peekString()) {
      (keyStruct as DecodedKeyNumberOfTakenSequenceFlows).elements!.push(parser.consumeString()!);
    }
    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing NUMBER_OF_TAKEN_SEQUENCE_FLOWS key, ${parser.bytesRemaining()} bytes remaining`);
    }

    return keyStruct as DecodedKeyNumberOfTakenSequenceFlows
  } else if (columnFamilyName === "INCIDENTS") {
    (keyStruct as DecodedKeyIncidents).incidentKey = parser.consumeZeebeKey()!;

    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing INCIDENTS key, ${parser.bytesRemaining()} bytes remaining`);
    }
    return keyStruct as DecodedKeyIncidents
  } else if (columnFamilyName === "JOBS") {
    (keyStruct as DecodedKeyJobs).jobKey = parser.consumeZeebeKey()!;

    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing JOBS key, ${parser.bytesRemaining()} bytes remaining`);
    }
    return keyStruct as DecodedKeyJobs
  } else if (columnFamilyName === "VARIABLES") {
    (keyStruct as DecodedKeyVariables).processInstanceKey = parser.consumeZeebeKey()!;
    (keyStruct as DecodedKeyVariables).fieldName = "";
    while (undefined !== parser.peekString()) {
      const fieldName = parser.consumeString();
      if (fieldName && fieldName !== undefined) (keyStruct as DecodedKeyVariables).fieldName = fieldName;
    }
    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing VARIABLES key, ${parser.bytesRemaining()} bytes remaining`);
    }

    return keyStruct
  } else {
    throw new Error(`The column family ${columnFamilyName} has no decoder`)
  }
}
