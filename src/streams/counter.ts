import { Writable } from 'stream';

import {ldbLineToKeyValue, ldbToObjectTransform} from "./decoder.js";


type ColumnFamilyName = string;
export type CountZeebeColumnFamilies = Record<ColumnFamilyName, number>;

/**
 * Take chunks and build a total per ColumnFamilyName
 */
export class CountByFamilyName extends Writable {
  public counted: CountZeebeColumnFamilies = Object.create(null);

  constructor() {
    super({ objectMode: true });
    this.counted = Object.create(null);
  }

  _write(chunk: ldbLineToKeyValue, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    try {
      const key = chunk?.key;
      const name = key?.family;

      if (name) {
        const prev = this.counted[name];
        this.counted[name] = prev === undefined ? 1 : prev + 1;
      }

      callback();
    } catch (err) {
      callback(err as Error);
    }
  }
}

type IncidentMessage = string;
export type IncidentsPerMessageCount = Record<IncidentMessage, number>;

/**
 * Take chunks and build a total per incidents message
 */
export class CountPerIncidentMessage extends Writable {
  public counted: IncidentsPerMessageCount = Object.create(null);

  constructor() {
    super({ objectMode: true });
    this.counted = Object.create(null);
  }

  _write(chunk: ldbLineToKeyValue, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    try {
      const key = chunk?.key;
      const name = key?.family;
      const value = chunk?.value as string;

      if (value) {
        console.log(`Value found ${JSON.stringify(value)}`);
        const prev = this.counted[value];
        this.counted[value] = prev === undefined ? 1 : prev + 1;
      }

      callback();
    } catch (err) {
      callback(err as Error);
    }
  }
}
