import {assert} from "chai";
import {decodeKey} from "../src/decoders/zeebeKey.js";

describe('Testing the capacity to process the keys of the Zeebe DB', () => {
  const numberOfTakenSequenceFlowsKey1 = "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\b\u0000\b\u0000\u0000\u0000\u0005((\u0000\u0000\u0000\u000fGateway_1iu457q\u0000\u0000\u0000\fFlow_1tpm1z9"

  it('should decode NUMBER_OF_TAKEN_SEQUENCE_FLOWS keys', () => {
    assert.deepEqual(decodeKey(numberOfTakenSequenceFlowsKey1),
      {
        family: "NUMBER_OF_TAKEN_SEQUENCE_FLOWS",
        processInstanceKey: 2251799814023208,
        elements: [ "Gateway_1iu457q", "Flow_1tpm1z9" ]
      });
  });
});
