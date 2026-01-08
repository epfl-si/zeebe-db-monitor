import {Stream} from 'node:stream'
import {TransformCallback} from "node:stream";
import {TransformOptions} from "stream";

import {ZbColumnFamilies} from "../zbColumnFamilies.js";
import {decodeKey} from "../decoders/zeebeKey.js";
import {unpackValue} from "../decoders/zeebeValue.js";
import {cleanStringFromHexIdentifier, hexToBuffer} from "../decoders/utils.js";
import {DecodedKey} from "../zbColumnFamiliesTypes.js";

type ldbStreamTransformerOptions = TransformOptions & {
  skipColumnFamilyNames?: (keyof typeof ZbColumnFamilies)[]
}

export type ldbLineToKeyValue = {
  key: DecodedKey  // will be one of the descent types of DecodedKey
  value: unknown
}

/**
 * This abstract class gives the power to pipeline
 * a spawn process stdout of a ldb command ('ldb scan --hex') on
 * a Zeebe RocksDB pack-valued DB to whatever you want once your overload _transform
*/
class ldbOnZeebeDbToKeyValueTransform extends Stream.Transform {
  protected readonly skipColumnFamilyNames: (keyof typeof ZbColumnFamilies)[];

  constructor(options:ldbStreamTransformerOptions = {}) {
    super({  ...options, objectMode: true });
    this.skipColumnFamilyNames = options.skipColumnFamilyNames || [];

    if (
      process.env.ZEEBE_DB_MONITOR_DECODER_SHOW_WARNING_IN_CONSOLE &&
      process.env.ZEEBE_DB_MONITOR_DECODER_SHOW_WARNING_IN_CONSOLE == "true"
    ) {
      this.on('warn', (err: any) => console.log(`Warn: ${ err }`))
    }
  }

  async decodeLdbLine(
    line: string,
    skipColumnFamilyNames?: string[]
  ) {
    const parts = line.split('==>');

    let keyDecoded
    let valueDecoded

    try {
      const keyHex = cleanStringFromHexIdentifier(parts[0])

      // Convert hex string to Buffer
      const keyBuffer = Buffer.from(keyHex, 'hex');
      keyDecoded = decodeKey(
        Uint8Array.from(keyBuffer).buffer,
        skipColumnFamilyNames
      )

      // Decode the value if a key has been found
      if (keyDecoded && parts.length === 2) {
        try {
          const valueHex = cleanStringFromHexIdentifier(parts[1])
          // // Convert hex string to Buffer
          valueDecoded = unpackValue( hexToBuffer(valueHex) )
        } catch (e) {
          this.emit(
            'warn',
            `Unable to decode the value for the key ${JSON.stringifyBigInt(keyDecoded)}: ${e}. Setting the value to undefined..`
          )
        }
      }
    } catch (e) {
      this.emit(
        'warn',
        `Unable to decode a key: ${e}. Skipping..`
      )
    }

    return {
      key: keyDecoded,
      value: valueDecoded,
    } as ldbLineToKeyValue
  }
}

export class ldbToObjectTransform extends ldbOnZeebeDbToKeyValueTransform {
  async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
    const lines = chunk.toString().split('\n');
    let keyValue = {}

    try {
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          keyValue = await this.decodeLdbLine(line, this.skipColumnFamilyNames);

          this.push(keyValue);
        } catch (err: any) {
          this.emit('warn', `Decoding a LDB line threw an error: ${ err }`);
        }
      }
      callback(); // continue to next chunk
    } catch(outerErr) {
      this.emit('warn', `Unexpected error in ldbToObjectTransform: ${ outerErr }`);
      callback(); // keep going
    }
  }
}

export class ldbToJSONSTransform extends ldbOnZeebeDbToKeyValueTransform {
  private isFirst: boolean = true;

  _flush(callback: TransformCallback) {
    this.push('\n]\n');
    callback();
  }

  async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
    const lines = chunk.toString().split('\n');
    let keyValue = {}

    try {
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          keyValue = await this.decodeLdbLine(line, this.skipColumnFamilyNames);

          this.push(
            `${ this.isFirst ? '[\n': ',\n'}${ JSON.stringifyBigInt(keyValue) }`
          );

          this.isFirst = false
        } catch (err: any) {
          this.emit('warn', `Transforming a LDB line to JSON threw an error: ${ err }`);
        }
      }
      callback(); // continue to next chunk
    } catch(outerErr) {
      this.emit('warn', `Unexpected error in ldbToJSONSTransform: ${ outerErr }`);
      callback(); // keep going
    }
  }
}
