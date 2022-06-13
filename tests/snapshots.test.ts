import 'mocha'
import 'path'
import { ZeebeDB } from '../src/zeebeDB';
import {runtimeDir} from "../src/folders";

/* Init chai shortcuts */
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect


describe('snapshots data integrity tests', () => {
  describe('Zeebe DB API', () => {
    let zdb : ZeebeDB;

    before(function() {
      zdb = new ZeebeDB(runtimeDir);
      expect(zdb.db.isOperational()).to.be.true
    })

    it('should let me count the number of PROCESS_VERSION', async () => {
      console.debug('counting PROCESS_VERSION')
      let count = 0;
      await zdb.walkColumnFamily('PROCESS_VERSION', function() {
        count++;
      })
      console.debug(`Number of PROCESS_VERSION found: ${count}`)
      expect(count).to.be.equal(1)
    })

    it('should let me count the number of JOBS', async () => {
      console.debug('counting JOBS')
      let count = 0;
      await zdb.walkColumnFamily('JOBS', function() {
        count++;
      })
      console.debug(`Number of JOBS found: ${count}`)
      expect(count).to.be.greaterThan(1)
    })
  })
})
