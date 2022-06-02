import 'mocha'
import 'path'
import * as path from "path";


import {getDirectories} from "../src/utils";
import { ZeebeDB } from '../src/zeebeDB';

/* Init chai shortcuts */
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect


// TODO: Manage multiple snapshots in the directory
// TODO: Manage the CURRENT if available

const snapshotPathEnv = process.env['SNAPSHOT_PATH'] ??
  (() => {
    throw ("Missing env var SNAPSHOT_PATH that declare the base path to the snapshots folder, e.g.: ")
  })()

const snapshotsSubDir = 'raft-partition/partitions/1/snapshots'
const snapshotsWorkingDir = path.join(
  snapshotPathEnv,
  snapshotsSubDir,
  getDirectories(path.join(snapshotPathEnv, snapshotsSubDir))[0]  // get the first folder (will be a snapshot number)
)

describe('snapshots data integrity tests', () => {
  describe('Zeebe DB API', () => {
    let zdb : ZeebeDB;

    before(function() {
      zdb = new ZeebeDB(snapshotsWorkingDir);
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
