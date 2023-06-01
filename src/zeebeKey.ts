/**
 * Provide utilities to transform Zeebe keys to a readable object
 */

import {TextEncoder, TextDecoder} from 'util';
import {columnFamiliesNames} from "./zbColumnFamilies.js";


/**
 * From a key as ArrayBuffer, we should be able to return this data
 */
type DecodedKey = {
  family: string
  processInstanceKey?: number
  elements?: string[]
}

function keyParser (key: string | ArrayBuffer) {
  const keyBytes : ArrayBuffer = (typeof(key) === "string") ? (new TextEncoder()).encode(key).buffer : key;
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
    consumeZeebeKey: consume(peekZeebeKey, () => 8),
    peekString,
    consumeString: consume<string>(peekString, (peeked) => peeked.length + 4),
    bytesRemaining
  }
}

export function decodeKey (key: string | ArrayBuffer) {
  const parser = keyParser(key);

  const columnFamily = parser.consumeInt64(/* max_credible = */ 1000) as number;
  const columnFamilyName = columnFamiliesNames[columnFamily];
  const keyStruct : DecodedKey = {
    family: columnFamilyName
  };

  if (columnFamilyName === "NUMBER_OF_TAKEN_SEQUENCE_FLOWS") {
    keyStruct.processInstanceKey = parser.consumeZeebeKey();
    keyStruct.elements = [];
    while (undefined !== parser.peekString()) {
      keyStruct.elements.push(parser.consumeString()!);
    }
    if (parser.bytesRemaining() !== 0) {
      throw new Error(`Error parsing NUMBER_OF_TAKEN_SEQUENCE_FLOWS key, ${parser.bytesRemaining()} bytes remaining`);
    }
  } else if (columnFamilyName === "JOBS") {
    throw new Error(`The column family ${columnFamilyName} has no decoder`)
  } else {
    throw new Error(`The column family ${columnFamilyName} has no decoder`)
  }

  return keyStruct;
}
