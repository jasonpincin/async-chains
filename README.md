async-chains
============

Create asynchronous callback chains. Make them powerful with built-in support for caolan's excellent [async](https://github.com/caolan/async) module.

# example

Create a few functions that adhere to the error-first callback convention in node. Chain them together to create a new function.  

```js
var chain  = require('async-chains')

function cap (s)            { return s.toUpperCase()  }
function capEach (arr, cb)  { cb(null, arr.map(cap))  }
function toString (arr, cb) { cb(null, arr.join(' ')) }

var arrayToCapString = chain(capEach, toString)

arrayToCapString(process.argv.slice(2), function (err, result) {
    console.log(result)
})
```

When you invoke the new function, the arguments you invoke it with are passed to the first function in the chain. The callback arguments 
of that function are passed to the next function in the chain, and so on. If any function passes an error to a callback, the remainder of the 
steps in the chain are skipped, and the final callback receives the error.

# example with async

async-chains was written to make expressing task sequences simpler, especially when leveraging caolan's [async](https://github.com/caolan/async) 
module, while maintaining the node callback pattern. Here's an example of a chain that leverages async to do some file ops:

```js
var chain  = require('async-chains')
,   async  = require('async')
,   fs     = require('fs')
,   path   = require('path')

function readdirFullpath (dir, cb) {
    fs.readdir(dir, function (err, files) {
        cb(err, files.map(function (f) {
            return path.join(dir, f)
        }))
    })
}
function reFilter (pattern) {
    return function (str, cb) {
        cb(str.match(pattern) ? true : false)
    }
}
function fileStats (file, cb) {
    fs.stat(file, function (err, stats) {
        cb(err, {file: file, stats: stats})
    })
}
var getVimfileStats = chain(
    readdirFullpath, 
    chain.link.noError(async.filter, reFilter(/\.vim[^\/]*$/)), 
    chain.link(async.concat, fileStats))

getVimfileStats(process.env.HOME, function (err, result) {
    if (err) return console.error(err.message)
    result.forEach(function (item) {
        console.log('%s, last modified on %s', path.basename(item.file), item.stats.mtime)
    })
})
```

In this example, we use chain.link to interface with async functions. The async collection function argument pattern, for the most part, 
is: array, iterator, callback. The array and callback args will be supplied from the previous step in the chain, but in order to inject 
the iterator we want to use, we use chain.link(asyncCollectionFunction, iteratorFunction).

# api

```js
var chain = require('async-chains')
```

## var chainFn = chain(fn1, fn2, fn3, ...)

Create a new `function (arg1, arg2, ..., finalCallback)` that when invoked will have it's args passed to fn1 allong with a callback. When fn1 
calls the supplied callback, the result of that callback is supplied as an argument to fn2, etc. If any callback is supplied an error argument, 
no further chain steps will be called, and the final callback will be immediately invoked with the error. Once the final function in the chain 
completes and calls it's callback, the arguments are passed to the finalCallback.

## var linkedFn = chain.link(asyncCollectionFunction, param1, param2, ..., iterator)

Returns a function usable in a chain that calls the async collection function given with any additional parameters needed (such is the case 
with the limit variety such as eachLimit), and iterator. The result of the previous chain step's output will be supplied as the first argument to 
the async collection function.

## var linkedFn = chain.link.noError(asyncCollectionFunction, param1, param2, ..., iterator)

This returns a function usable in a chain, as above, but should be used on async functions that do NOT return an error object. One such example is 
async.filter.

## chain.to(chainFn, finalCallback)

Create a function suitable for use as a standard node callback that feeds into a chain. Example:

```js
var lastChange = chain(chain.link(async.concat, fs.stat), chain.link(async.reduce, 0, function (memo, item, cb) {
    cb(null, item.mtime > memo ? item.mtime : memo)
}))

fs.readdir(process.cwd(), chain.to(lastChange, function (err, result) {
    console.log(result)
}))
```

# testing

`npm test`

or 

`tap test`

or

`jasmine-node test`
