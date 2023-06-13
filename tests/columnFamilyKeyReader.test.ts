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
});
