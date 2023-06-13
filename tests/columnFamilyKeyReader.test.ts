import {assert} from "chai";
import {decodeKey} from "../src/zeebeKey.js";

describe('Testing the capacity to process the keys of the Zeebe DB', () => {
  it('should decode a NUMBER_OF_TAKEN_SEQUENCE_FLOWS key', () => {
    const numberOfTakenSequenceFlowsKey = "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\b\u0000\b\u0000\u0000\u0000\u0005((\u0000\u0000\u0000\u000fGateway_1iu457q\u0000\u0000\u0000\fFlow_1tpm1z9"

    assert.deepEqual(decodeKey(numberOfTakenSequenceFlowsKey),
      {
        family: "NUMBER_OF_TAKEN_SEQUENCE_FLOWS",
        processInstanceKey: 2251799814023208,
        elements: [ "Gateway_1iu457q", "Flow_1tpm1z9" ]
      });
  });

  it('should decode a VARIABLES key', () => {
    const variableKey = new Uint8Array(
[0,0,0,0,0,0,0,10,0,8,0,0,0,5,40,246,0,0,0,3,80,68,70]).buffer

    assert.deepEqual(decodeKey(variableKey),
      {
        family: "VARIABLES",
        processInstanceKey: 2251799814023414,
        fieldName: 'PDF',
      });
  });
});
