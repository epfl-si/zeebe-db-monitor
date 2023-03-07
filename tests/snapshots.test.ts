import 'mocha'
import 'path'
import {walkColumnFamily} from '../src/zeebeDB.js';
import { expect } from 'chai';
import {unpack} from "msgpackr";


describe('snapshots data reading tests', () => {
  describe('Zeebe DB reading', () => {
    it('should let me count the number of a column', async () => {
      console.debug('counting JOBS')

      let count = 0;
      for await (const row of await walkColumnFamily('PROCESS_VERSION', 'key')) {
        !count ? count = 1 : count++;
      }

      console.debug(`Number of JOBS found: ${count}`)
      expect(count).to.be.greaterThan(0)
    })

    it('should let me read some values', async () => {
      const incidentMessages: string[] = []

      for await (const row of await walkColumnFamily('INCIDENTS', 'keyValue')) {
        const unpackedValue = unpack(row.value)
        incidentMessages.push(unpackedValue?.incidentRecord?.errorMessage)
      }

      expect(incidentMessages.length).to.be.greaterThan(0)
      expect(incidentMessages[0]).to.be.a('string')
    })
  })
})
