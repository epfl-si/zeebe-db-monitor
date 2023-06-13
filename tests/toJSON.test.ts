import {assert} from 'chai'
import {getZeebeContent} from "../src/JsonExporter.js";


describe('Testing the capacity to generate JSON from a Zeebe DB', async function () {

  describe('about reading a specific column family keys', function () {
    it('should be able to read a buffer key like NUMBER_OF_TAKEN_SEQUENCE_FLOWS from the current db', async function (){
      const nbTakenSequenceFlows = await getZeebeContent(['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'])

      assert.isNotEmpty(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS']);
      assert.isDefined(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'][0].processInstanceKey);
      assert.isNotEmpty(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'][0].elements);
    });

    it('should be able to read a buffer key like VARIABLES from the current db', async function (){
      const nbTakenSequenceFlows = await getZeebeContent(['VARIABLES'])

      assert.isNotEmpty(nbTakenSequenceFlows['VARIABLES']);
      assert.isDefined(nbTakenSequenceFlows['VARIABLES'][0].processInstanceKey);
      assert.isNotEmpty(nbTakenSequenceFlows['VARIABLES'][0].fieldName);
    });
  });
})
