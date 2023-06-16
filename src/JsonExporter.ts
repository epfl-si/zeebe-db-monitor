/**
 * Provide functionalities to transform a zeebe db to a json file
 * Warning:
 *   the key values outputted does not reflect the real Zeebe key-value.
 *   it is completely arbitrary, as was the need.
 */

import _ from "lodash";
import CryptoJS from 'crypto-js';
import {LevelUp} from "levelup";
import RocksDB from "rocksdb";

import { walkColumnFamily, ZDB } from './zeebeDB.js'
import { unpackValue } from './zeebeValue.js'
import {DecodedKeyIncidents, DecodedKeyNumberOfTakenSequenceFlows, DecodedKeyVariables, decodeKey} from './zeebeKey.js'
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
  keyProcessor: (row: any) => any,
  valueProcessor: (row: any) => any,
) => {
  const data: { key: any, value: any }[] = [];

  for await (const row of await walkColumnFamily(columnFamilyName, 'keyValue', db)) {
    const rowData = {
      'key': keyProcessor(row),
      'value': valueProcessor(row),
    }

    //don't do anything if key is empty
    if (rowData.key) {
      rowData.value = valueProcessor(row) ?? undefined
      data.push(rowData)
    }
  }
  return data
}

/**
 * This function serves to read the content of the DB
 * It mainly set the good encoder for the good column family
 */
export const getZeebeContent = async (columnFamilyWanted: (keyof typeof ZbColumnFamilies)[]) => {
  let close;
  let db: LevelUp<RocksDB>;
  ( { close, db } = await ZDB() );

  const columnFamilyKeysProcessors: columFamilyNameProcessor[] = [
    {
      name:'NUMBER_OF_TAKEN_SEQUENCE_FLOWS',
      keyComponentsDescription:'${ProcessInstanceKey} ${elements1} ${elements2}',
      keyExample: '2262799816461518 Gateway_4xf2f Flow_2ifm4z9',
      keyDecoder: (row) => decodeKey(row.key) as DecodedKeyNumberOfTakenSequenceFlows,
      valueDecoder: () => void 0,
    },
    {
      name: 'INCIDENTS',
      keyComponentsDescription: '${ProcessInstanceKey}',
      keyDecoder: (row) => decodeKey(row.key) as DecodedKeyIncidents,
      valueDecoder: (row) => unpackValue(row.value)?.incidentRecord,
    },
    {
      name: 'VARIABLES',
      keyComponentsDescription: '${ProcessInstanceKey} ${label}',
      keyDecoder: (row) => {
        const key = decodeKey(row.key) as DecodedKeyVariables

        if (key.fieldName && [
          'created_at',
          'updated_at',
          'phdStudentSciper',
        ].includes(key.fieldName)) {
          return key
        }
      },
      valueDecoder: (row) => {
          const key = decodeKey(row.key) as DecodedKeyVariables
          if (key.fieldName && [
            'created_at',
            'updated_at',
            'phdStudentSciper',
          ].includes(key.fieldName)) {
            const pass = process.env.PHDASSESS_ENCRYPTION_KEY
            if (!pass) throw Error('Please set your env file to have the PHDASSESS_ENCRYPTION_KEY')

            const unpackedValueCrypted = unpackValue(unpackValue(row.value).value)

            if (unpackedValueCrypted && pass) {
              const bytes = CryptoJS.AES.decrypt(unpackedValueCrypted, pass)
              return bytes?.toString(CryptoJS.enc.Utf8).slice(1, -1)
            }
          }
        },
      },
    {
      name: 'JOBS',
      //keyComponentsDescription: '${ProcessInstanceKey}',
      keyDecoder: (row) => {
        return decodeKey(row.key)
      },
      valueDecoder: (row) => {
        const unpackedValues = unpackValue(row.value)?.jobRecord

        return _.omit(
          unpackedValues,
          ['customHeaders']
        )
      },
    },
  ]

  const data: any = {}

  for (const columnFamilyProcessor of columnFamilyKeysProcessors) {
    const columnFamilyName = columnFamilyProcessor.name

    if (!columnFamilyWanted.includes(columnFamilyName)) continue

    data[columnFamilyName] = []

    data[columnFamilyName] = await getColumnFamilyContent(
      db,
      columnFamilyProcessor.name,
      columnFamilyProcessor.keyDecoder,
      columnFamilyProcessor.valueDecoder,
    )
  }

  if (close !== undefined) await close();

  return data;
}
