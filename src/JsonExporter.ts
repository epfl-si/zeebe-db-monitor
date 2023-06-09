/**
 * Provide functionalities to transform a zeebe db to a json file
 * Designed to be used into a command line fashion
 */

import _ from 'lodash'

import { walkColumnFamily, ZDB } from './zeebeDB.js'
import { unpackValue } from './zeebeValue.js'
import { decodeKey } from './zeebeKey.js'
import {LevelUp} from "levelup";
import RocksDB from "rocksdb";
import {ZbColumnFamilies} from "./zbColumnFamilies";

// bigint will be happy to get JSON stringified:
// @ts-ignore
BigInt.prototype.toJSON = function() { return this.toString() }


type ZeebeRow = {
  key: ArrayBuffer,
  value: Buffer
}

// set which column family need which decoder
type columFamilyNameProcessor  = {
  name: keyof typeof ZbColumnFamilies;
  keyDecoder: (row: ZeebeRow) => any;
  keyComponentsDescription?: string;  // what is the key composed of
  keyExample?: string
  valueDecoder: (row: ZeebeRow) => any;
}


/**
 * A kind of utility function to get a specific column family,
 * with a processor attached to it, to tailor the result
 */
export const getColumnFamilyContent = async (
  db: LevelUp<RocksDB>,
  columnFamilyName: keyof typeof ZbColumnFamilies,
  processor: (row: any) => any
) => {
  const data = [];

  for await (const row of await walkColumnFamily(columnFamilyName, 'keyValue', db)) {
    const processedReturn = processor(row);
    if (processedReturn) data.push(processedReturn);
  }
  return data
}

/**
 * This function serves to read the content of the DB
 * It mainly set the good encoder for the good column family
 */
export const getZeebeContent = async () => {
  let close;
  let db: LevelUp<RocksDB>;
  ( { close, db } = await ZDB() );

  const columnFamilyKeysNeeded: columFamilyNameProcessor[] = [
    // {
    //   name:'NUMBER_OF_TAKEN_SEQUENCE_FLOWS',
    //   keyComponentsDescription:'${ProcessInstanceKey} ${elements1} ${elements2}',
    //   keyExample: '2262799816461518 Gateway_4xf2f Flow_2ifm4z9',
    //   keyDecoder: (row) => {
    //     const keyStruct = decodeKey(row.key)
    //
    //     // keep only the processInstanceKey and the elements from the key
    //     const { family, ...keyStructWithoutFamily } = keyStruct
    //     return keyStructWithoutFamily
    //   },
    //   valueDecoder: (row) => row,
    // },
    // {
    //   name: 'INCIDENTS',
    //   keyComponentsDescription: '${ProcessInstanceKey}',
    //   keyDecoder: (row) => {
    //     return unpackValue(row.value)?.incidentRecord
    //   },
    //   valueDecoder: (row) => unpackValue(row.value),
    // },
    {
      name: 'VARIABLES',
      keyComponentsDescription: '${ProcessInstanceKey} ${label}',
      keyDecoder: (row) => row.key,
      valueDecoder: (row) => {
          // need created_at, updated_at, phdStudentSciper
          let value = unpackValue(row.value)

          return _.pick(value,
            [
              'created_at',
              'updated_at',
              'phdStudentSciper',
            ])
        },
      },
  ]

  const data: any = {}

  for (const columnFamilyProcessor of columnFamilyKeysNeeded) {
    const columnFamilyName = columnFamilyProcessor.name

    data[columnFamilyName] = []

    data[columnFamilyName] = await getColumnFamilyContent(
      db,
      columnFamilyProcessor.name,
      columnFamilyProcessor.keyDecoder
    )
  }

  if (close !== undefined) await close();

  return data;
}
