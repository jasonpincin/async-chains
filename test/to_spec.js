if (require.main === module) {
    var _t = require('jasmine-node').getEnv()
    _t.addReporter(new (require('jasmine-tapreporter'))(console.log))
    process.nextTick(_t.execute.bind(_t))
}
var chain       = require('..')
,   async       = require('async')

function cf (id, delay, err) {
    err = err === undefined ? null : err
    return function (data, cb) {
        data.push({id:id})
        if (delay) setTimeout(function () {
            cb(err, data)
        })
        else cb(err, data)
    }
}
function lf (data, err, cb) {
    cb(err, data)
}

describe('chain.to', function () {
    var c1 = cf(1), c2 = cf(2, 1), c3 = cf(3)
    var ce = cf(4, 1, new Error('error'))

    it('allows a chain to be given as a callback', function (done) {
        var c = chain(c1, c2, c3)

        lf([], null, chain.to(c, function (err, result) {
            expect(err).toBe(null)
            expect(result).toEqual([
                {id:1},
                {id:2},
                {id:3}
            ])
            done()
        }))
    })
    
    it('calls callback with error supplied by lead function', function (done) {
        var c = chain(c1, ce, c3)

        lf([], new Error('lf error'), chain.to(c, function (err, result) {
            expect(err).toEqual(jasmine.any(Error))
            expect(err.message).toEqual('lf error')
            done()
        }))
    })

    it('calls callback with error supplied by any step in chain', function (done) {
        var c = chain(c1, ce, c3)

        lf([], null, chain.to(c, function (err, result) {
            expect(err).toEqual(jasmine.any(Error))
            expect(err.message).toEqual('error')
            done()
        }))
    })
})
