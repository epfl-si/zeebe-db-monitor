import {unpack} from "msgpackr";

export const unpackValue = (value:  Buffer | Uint8Array) => {
  return unpack(value)
}
