'use strict';

const through2 = require('through2')

/**
 * Transform a readable stream into one made of chunks of equal size,
 * up to a certain number of bytes, regardless of the size of the input chunks.
 * 
 * This module is based on through2 to create the transform stream.
 * 
 * @param {number} chunkSize - Size of each chunk
 * @return {Function} Stream transform function 
 */

const StreamChunkify = (chunkSize) => {
    // These arrays contain the Buffer objects and the size of each buffer
    let chunkBuffers = []
    let chunkBufferSizes = []

    // Stream transform function for through2
    const transformFunction = function(chunk, encoding, callback) {
        // Copy the data making sure it doesn't exceed chunkSize
        let remainingLength = chunk.length
        let sourceStart = 0
        while(remainingLength) {
            // Get the first buffer that's not full
            let i = 0
            while(i < chunkBuffers.length && chunkBufferSizes[i] >= chunkSize) {
                i++
            }
            
            // Check if we need to create a new buffer
            if(i === chunkBuffers.length) {
                chunkBuffers.push(Buffer.allocUnsafe(chunkSize))
                chunkBufferSizes.push(0)
            }

            // Add the data to the buffer
            let sourceEnd = sourceStart + (chunkSize - chunkBufferSizes[i])
            if(sourceEnd > chunk.length) {
                sourceEnd = chunk.length
            }
            chunk.copy(chunkBuffers[i], chunkBufferSizes[i], sourceStart, sourceEnd)
            let copiedLength = sourceEnd - sourceStart
            chunkBufferSizes[i] += copiedLength 
            remainingLength -= copiedLength
            sourceStart = sourceEnd
        }

        // If we have enough data, send the chunk
        while(chunkBufferSizes[0] == chunkSize) {
            let buffer = chunkBuffers.shift()
            chunkBufferSizes.shift()
            this.push(buffer)
        }

        callback()
    }

    // Flush function, to return what's still on the buffers
    const flushFunction = function(callback) {
        // Send all remaining chunks
        for(let i = 0; i < chunkBuffers.length; i++) {
            // Ignore empty buffers
            if(!chunkBufferSizes[i]) {
                continue
            }

            // If the buffer is not full, slice it to the correct size
            // Otherwise, send the entire buffer
            if(chunkBufferSizes[i] != chunkSize) {
                this.push(chunkBuffers[i].slice(0, chunkBufferSizes[i]))
            }
            else {
                this.push(chunkBuffers[i])
            }
        }

        // Cleanup
        chunkBuffers = []
        chunkBufferSizes = []

        callback()
    }

    return through2(transformFunction, flushFunction)
}

// Export the StreamChunkify function
module.exports = StreamChunkify
