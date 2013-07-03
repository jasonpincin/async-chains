var chain  = require('..')
,   async  = require('async')
,   fs     = require('fs')

var lastChange = chain(chain.link(async.concat, fs.stat), chain.link(async.reduce, 0, function (memo, item, cb) {
    cb(null, item.mtime > memo ? item.mtime : memo)
}))

fs.readdir(process.cwd(), chain.to(lastChange, function (err, result) {
    console.log(result)
}))
