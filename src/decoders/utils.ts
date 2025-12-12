export const cleanStringFromHexIdentifier = (s: string) => s.trim().replace(/^0x/, '');
export const hexToBuffer = (s: string) => Buffer.from(s, 'hex');
export const stringToHex = (s: string) => Buffer.from(s).toString('hex');

/**
 * ExtendJSON.stringify function to decode some big keys and values
 */
// Extend the JSON namespace to include our custom method
declare global {
  interface JSON {
    stringifyBigInt(value: any): string;
  }
}

JSON.stringifyBigInt = function (value: any): string {
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'bigint') {
        return val.toString() + 'n'; // append 'n' to indicate BigInt
      }
      return val;
    },
    2
  );
};
