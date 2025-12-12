import {Writable} from "node:stream";

/**
 * Fetch a stream of text to a variable
 * Be aware of your memory limitations when using this
 */
export class CaptureTextStream extends Writable {
  data: string

  constructor() {
    super({ objectMode: false });
    this.data = "";
  }
  _write(chunk: any, enc: any, cb: any) {
    this.data += chunk.toString();
    cb();
  }
}

/**
 * Fetch a stream of objects to a variable
 * Be aware of your memory limitations when using this
 */
export class CaptureObjectStream extends Writable {
  data: any[]

  constructor() {
    super({ objectMode: true });
    this.data = [];
  }

  _write(chunk: any, enc: any, cb: any) {
    this.data.push(chunk);
    cb();
  }
}
