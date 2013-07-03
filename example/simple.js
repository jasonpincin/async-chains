var chain  = require('..')

function cap (s)            { return s.toUpperCase()  }
function capEach (arr, cb)  { cb(null, arr.map(cap))  }
function toString (arr, cb) { cb(null, arr.join(' ')) }

var arrayToCapString = chain(capEach, toString)

arrayToCapString(process.argv.slice(2), function (err, result) {
    console.log(result)
})
