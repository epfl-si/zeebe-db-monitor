import 'mocha'
import 'path'
import {walkColumnFamily} from '../src/zeebeDB.js';


/* Init chai shortcuts */
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect


describe('snapshots data integrity tests', () => {
  describe('Zeebe DB API', () => {
    it('should let me count the number of PROCESS_VERSION', async () => {
      console.debug('counting PROCESS_VERSION')
      const columnFamiliesCount = await walkColumnFamily('PROCESS_VERSION')
      console.debug(`Number of PROCESS_VERSION found: ${columnFamiliesCount}`)
      expect(columnFamiliesCount).to.be.equal(1)
    })

    it('should let me count the number of JOBS', async () => {
      console.debug('counting JOBS')
      const columnFamiliesCount = await walkColumnFamily('PROCESS_VERSION')
      console.debug(`Number of JOBS found: ${columnFamiliesCount}`)
      expect(columnFamiliesCount).to.be.greaterThan(1)
    })
  })
})
