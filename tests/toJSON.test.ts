import {assert} from 'chai'
import {getZeebeContent} from "../src/JsonExporter.js";


describe('Testing the capacity to generate JSON from a Zeebe DB', async function () {

  describe('about reading a specific column family, named NUMBER_OF_TAKEN_SEQUENCE_FLOWS', function () {
    it('should be able to read a buffer key like  from the current db', async function () {
      const nbTakenSequenceFlows = await getZeebeContent(['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'])

      assert.isNotEmpty(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS']);
      assert.isDefined(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'][0].processInstanceKey);
      assert.isNotEmpty(nbTakenSequenceFlows['NUMBER_OF_TAKEN_SEQUENCE_FLOWS'][0].elements);
    });
  });

  describe('about reading a specific column family, named VARIABLES', function () {
    let variablesData: any

    before(async function () {
      variablesData = await getZeebeContent(['VARIABLES'])
    });

    it('should be able to read a buffer key like VARIABLES from the current db', async function (){
      assert.isNotEmpty(variablesData['VARIABLES']);
      assert.isDefined(variablesData['VARIABLES'][0].key.processInstanceKey);
      assert.isNotEmpty(variablesData['VARIABLES'][0].key.fieldName);
    });

    it('should be able to read a buffer value like VARIABLES from the current db', async function (){
      assert.isNotEmpty(variablesData['VARIABLES']);
      assert.isDefined(variablesData['VARIABLES'][0].value);
    });
  });
})
