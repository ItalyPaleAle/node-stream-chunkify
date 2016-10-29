# stream-chunkify

This Node.js module is a small (~50 SLOC) that implements a stream transform function to chunk a readable stream into another stream with a fixed byte size. 

The input stream can come in chunks that are either bigger or smaller than the desired chunk size, and this transform function will take care of all cases. Please note that the last chunk might be smaller than the desired chunk size if the input stream doesn't evenly divide into chunks of the required size.

This module is based on [through2](https://github.com/rvagg/through2).

## Install

Get the package from NPM:

````sh
npm install --save stream-chunkify
````

## API and Example

The module exposes just one function:

````js
StreamChunkify(chunkSize)
````

`chunkSize` is the desired size of the chunks, in bytes. 

The return value is a function that can be used with `pipe()`, for example:

````js
const StreamChunkify = require('StreamChunkify')
const fs = require('fs')

fs.createReadStream('input.txt')
    .pipe(StreamChunkify(100))
    .pipe(fs.createWriteStream('output.txt'))
````
