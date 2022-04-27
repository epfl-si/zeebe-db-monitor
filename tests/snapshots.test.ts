import 'mocha'
import 'path'
import * as path from "path";
import RocksDB from "rocksdb";
import levelup = require("levelup");
import {LevelUp} from "levelup";
import _ from 'lodash';
import {Dirent} from 'fs'
const { readdirSync } = require('fs')

const getDirectories = (source: String) =>
  (readdirSync(source, { withFileTypes: true }))
    .filter((dirent: Dirent) => dirent.isDirectory())
    .map((dirent: Dirent) => dirent.name)


const { dirname } = require('path')
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect
const assert = chai.assert

const snapshotsBasePath = '/snapshots-rw'
const snapshotsSubDir = 'raft-partition/partitions/1/snapshots'
const snapshotsSubDirListRelativePath = getDirectories(path.join(
  snapshotsBasePath,
  snapshotsSubDir
))

const snapshotsWorkingDir = path.join(snapshotsBasePath, snapshotsSubDir, snapshotsSubDirListRelativePath[0])

describe('snapshots filesystem integrity tests', () => {
  it('should be structured', () => {

    expect(snapshotsSubDirListRelativePath).to.be.length(
      1, "It looks like you have multiple snapshots folder. Please leave only one"
    )

    const awaitedContents = [
      "raft-partition",
      "raft-partition/partitions",
      "raft-partition/partitions/1",
      "raft-partition/partitions/1/snapshots",
      path.join(snapshotsSubDir, snapshotsSubDirListRelativePath[0]),
    ]

    assert.pathExists(snapshotsBasePath, "Unable to find the snapshots path");
    expect(snapshotsBasePath).to.be.a.directory("Snapshots path is not a directory").with.deep.subDirs.that.include.members(awaitedContents, "Can't find the awaited folders");
    expect(snapshotsBasePath).be.a.directory().with.files.that.satisfy(function(files: any) {
      return files.every((file: any) => file.slice(-4) === '.sst');
    }, "There is more files that needed in the working path")
  })
})

describe('snapshots data integrity tests', () => {
  let db: LevelUp<RocksDB>;

  const keyList: string[] = []

  const numberOfKeysToRetrieve = 100
  const numberOfElementsToConsoleLog = 125

  before( async () => {
    //console.log( "before executes once before all tests" );

    db = levelup(
        RocksDB(snapshotsWorkingDir)
      , {
        createIfMissing: false,
        readOnly: true,
        infoLogLevel: 'debug'
      },
      (err: Error | undefined) => {
        if (err) console.log(err)
      }
    )

    expect(db.isOperational()).to.be.true
    console.log("DB is up and running")

    //@ts-ignore
    for await (const [key, value] of db.iterator({ limit: numberOfKeysToRetrieve })) {
      keyList.push(key)
    }
  });

  it(`should console.log, rawly, the ${numberOfElementsToConsoleLog} first keys`, async () => {
    expect(db.isOperational()).to.be.true

    expect(keyList).length.greaterThan(numberOfElementsToConsoleLog)

    const randomStartingPosition = _.random(0, keyList.length - numberOfElementsToConsoleLog)
    const endingPosition = randomStartingPosition + numberOfElementsToConsoleLog

    console.log(`listing [${randomStartingPosition}:${endingPosition}] some ${numberOfElementsToConsoleLog} random keys uniquified of a ${keyList.length} keyList`)
    console.log(_.union(keyList).slice(randomStartingPosition, endingPosition))
  })

  it('should console.log, rawly, the ${numberOfElementsToConsoleLog} first keys', async () => {
    expect(db.isOperational()).to.be.true
    expect(keyList).length.greaterThan(0)

    for (const x of Array(numberOfElementsToConsoleLog).keys()) {
      const key = keyList[x]
      key && db.get(key, (err, value) => {
        if (err) console.log('Ooops!', err) // likely the key was not found
        // we may have something
        console.log(`key: ${key}, value: ${value.slice(0, 55)}`)
      })
    }
  })

  it('should get decoded key', async () => {
    console.log("trying to decode the keys")
    expect(db.isOperational()).to.be.true

    db.get(keyList[0], (err, value) => {
      if (err) return console.log('Ooops!', err) // likely the key was not found
      // we may have something
      console.log(`Key: ${keyList[0]}`)
    })
  })

  it('should have readable INCIDENTS entries', async () => {
    expect(false).to.be.true
  })

  after( () => {
    //console.log( "after executes once after all tests" );

    db.close(function (err) {
      if (err) console.log(`Error at closing the db ${err}`)
    })
  });
})
