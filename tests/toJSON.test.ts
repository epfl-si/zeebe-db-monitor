import {assert} from 'chai'

import {LevelUp} from "levelup";
import RocksDB from "rocksdb";

import {ZDB} from '../src/zeebeDB.js'
import {decodeKey} from "../src/zeebeKey.js";

import {unpackValue} from "../src/zeebeValue.js";
import {getColumnFamilyContent} from "../src/JsonExporter.js";


describe('Testing the capacity to generate JSON from a Zeebe DB', async function () {
  let close: () => void;
  let db: LevelUp<RocksDB>;

  before(async function () {
    ( { close, db } = await ZDB() );
  });

  after(async function () {
    if (close !== undefined) close();
  });

  describe('about using the processors', function() {
    it('should have multiple processors', async function () {
      getColumnFamilyContent
    })
  })

  describe('about reading key content', function () {
    it('should be able to read a buffer key from the current db', async function (){
      const familyContent = await getColumnFamilyContent(
        db,
        'NUMBER_OF_TAKEN_SEQUENCE_FLOWS',
        (row) => {
          assert(row.key instanceof ArrayBuffer ||
            row.key instanceof Buffer
          )
          const keyStruct = decodeKey(row.key)

          // keep only the processInstanceKey and the elements
          const { family, ...keyStructWithoutFamily } = keyStruct
          return keyStructWithoutFamily
        })

      assert.isNotEmpty(familyContent);
      assert.isDefined(familyContent[0].processInstanceKey);
      assert.isNotEmpty(familyContent[0].elements);
    });
  });

  describe('about reading value content', function () {

    it('should be able to read incidents table from the current db', async function (){
      const familyContent = await getColumnFamilyContent(
        db,
        'INCIDENTS',
        (row) => {
          return unpackValue(row.value)
        })

      assert.isDefined(familyContent)
    });

    it('should be able to read a variable from the current db', async function (){
      const familyContent = await getColumnFamilyContent(
        db,
        'VARIABLES',
        (row) => {
          // need created_at, updated_at, phdStudentSciper
          return unpackValue(row.value)
        })

      assert.isDefined(familyContent)
    });
  });
})
