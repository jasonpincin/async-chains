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

describe('chain.link', function () {
    var c1 = cf(1), c2 = cf(2, 1), c3 = cf(3)
    var cbs

    beforeEach(function () {
        cbs = {
            each: function (item, cb) {
                item.touched = true
                cb(null, item)
            },
            filter: function (item, cb) {
                cb(item.id >= 2)
            }
        }
        spyOn(cbs, "each").andCallThrough()
        spyOn(cbs, "filter").andCallThrough()
    })

    it('allows async.concat to be a step', function (done) {
        var c = chain(c1, c2, c3, chain.link(async.concat, cbs.each))
        c([], function (err, result) {
            expect(err).toBe(null)
            expect(cbs.each.callCount).toEqual(3)
            expect(result).toEqual([
                {id:1, touched: true},
                {id:2, touched: true},
                {id:3, touched: true}
            ])
            done()
        })
    })
    
    it('allows async.each to be a step', function (done) {
        var c = chain(c1, c2, c3, chain.link(async.each, cbs.each))
        c([], function (err, result) {
            expect(err).toBe(null)
            expect(cbs.each.callCount).toEqual(3)
            expect(result).toBeUndefined()
            done()
        })
    })
    
    it('allows async.filter to be a step', function (done) {
        var c = chain(c1, c2, c3, chain.link.noError(async.filter, cbs.filter))
        c([], function (err, result) {
            expect(err).toBe(null)
            expect(cbs.filter.callCount).toEqual(3)
            expect(result).toEqual([
                {id:2},
                {id:3}
            ])
            done()
        })
    })
    
    it('allows async.filter to be a middle step', function (done) {
        var c = chain(c1, c2, chain.link.noError(async.filter, cbs.filter), c3)
        c([], function (err, result) {
            expect(err).toBe(null)
            expect(cbs.filter.callCount).toEqual(2)
            expect(result).toEqual([
                {id:2},
                {id:3}
            ])
            done()
        })
    })
})
