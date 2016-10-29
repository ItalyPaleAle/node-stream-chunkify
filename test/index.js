'use strict';

const StreamChunkify = require('../index')

const assert = require('assert')
const fs = require('fs')
const temp = require('temp')
const md5 = require('md5-file/promise')

// Automatically track and cleanup temporary files at exit
temp.track()

// Filename of the test file
let testFilename = 'test/testimage.jpg'

// Compute the MD5 of the test image
let inMD5 = md5.sync(testFilename)

// Use promises to wait for pipes to be completed
let streamToPromise = (stream) => {
    return new Promise((resolve, reject) => {
        stream.on('end', resolve)
        stream.on('error', reject)
    })
}

// Function that returns tests
let testFactory = (testCode) => {
    return function(done) {
        // Create streams for tests
        // The read stream has an internal buffer size of 16 KB
        let outStream = temp.createWriteStream({highWaterMark: 16384})
        let inStream = fs.createReadStream(testFilename)

        // Run the test
        testCode(inStream, outStream)

        // Check results
        streamToPromise(inStream)
        .then(() => {
            return md5(outStream.path)
        })
        .then(outMD5 => {
            assert.equal(inMD5, outMD5)

            done()
        })
    }
}

// Tests for StreamChunkify
describe('StreamChunkify', () => {

    // Test without any transform - just pipe through!
    // This is to test the ...tests
    it('Pipe through (control test)', testFactory((inStream, outStream) => {
        inStream.pipe(outStream)
    }))

    it('Chunk size larger than the entire test file', testFactory((inStream, outStream) => {
        inStream
            .pipe(StreamChunkify(2 * 1024 * 1024)) // 2 MB
            .pipe(outStream)
    }))

    it('Chunk size larger than internal buffer', testFactory((inStream, outStream) => {
        inStream
            .pipe(StreamChunkify(100 * 1024)) // 100 KB
            .pipe(outStream)
    }))

    it('Chunk size smaller than internal buffer', testFactory((inStream, outStream) => {
        inStream
            .pipe(StreamChunkify(10 * 1024)) // 10 KB
            .pipe(outStream)
    }))
})