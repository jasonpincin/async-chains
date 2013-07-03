var chain  = require('..')
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
    console.log('vim files\n---------')
    result.forEach(function (item) {
        console.log('%s, last modified on %s', path.basename(item.file), item.stats.mtime)
    })
})
