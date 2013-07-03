if (require.main === module) {
    var _t = require('jasmine-node').getEnv()
    _t.addReporter(new (require('jasmine-tapreporter'))(console.log))
    process.nextTick(_t.execute.bind(_t))
}
var chain       = require('..')

function cf (touchedBy, delay, err) {
    err = err === undefined ? null : err
    return function (data, cb) {
        data.touchedBy = data.touchedBy || []
        data.touchedBy.push(touchedBy)
        if (delay) setTimeout(function () {
            cb(err, data)
        })
        else cb(err, data)
    }
}

describe('a chain', function () {
    var c1 = cf(1), c2 = cf(2, 1), c3 = cf(3)
    var c = chain(c1, c2, c3)
    it('exposes steps', function () {
        expect(c.steps).toEqual([c1, c2, c3])
    })
    it('returns an EventEmitter when called', function () {
        var returnVal = c({})
        expect(returnVal.on).toBeDefined()
    })
})
describe('a chain with no errors', function () {
    var c1 = cf(1), c2 = cf(2, 1), c3 = cf(3)
    var c = chain(c1, c2, c3)
    it('calls the final callback with no error', function (done) {
        c({}, function (err, result) {
            expect(err).toBe(null)
            done()
        })
    })
    it('will emit a step event, with args, for each step and a complete event with args', function (done) {
        var onStep = function (step, args) {
            if (step === 0)
                expect(args).toEqual([null, {hello:'world'}])
            else if (step === 1)
                expect(args).toEqual([null, {hello:'world', touchedBy: [1]}])
            else if (step === 2)
                expect(args).toEqual([null, {hello:'world', touchedBy: [1, 2]}])
        }
        c({hello:'world'}).on('step', onStep).on('complete', function (finalArgs) {
            expect(finalArgs).toEqual([null, {hello:'world', touchedBy: [1, 2, 3]}])
            done()
        })
    })
    it('calls the final callback with expected result', function (done) {
        c({hello:'world'}, function (err, result) {
            expect(result).toEqual(jasmine.any(Object))
            expect(result).toEqual({hello: 'world', touchedBy: [1, 2, 3]})
            done()
        })
    })
})

describe('a chain with 1 error', function () {
    var c1 = cf(1, 1), c2 = cf(2, 0, new Error('error1')), c3 = cf(3)
    var c = chain(c1, c2, c3)
    var onStep = jasmine.createSpy()
    var onComplete = jasmine.createSpy()
    it('will stop at error step', function (done) {
        c({hello:'world'}, function (err) {
            expect(err).toEqual(jasmine.any(Error))
            expect(err.message).toEqual('error1')
            done()
        }).on('step', onStep).on('complete', onComplete)
    })
    it('will only emit step events up to the error step', function () {
        expect(onStep.callCount).toEqual(2)
    })
    it('will not emit a complete event', function () {
        expect(onComplete).not.toHaveBeenCalled()
    })
})

describe('a chain with 2 errors', function () {
    var c1 = cf(1, 1, new Error('error1')), c2 = cf(2, 0), c3 = cf(3, 1, new Error('error2'))
    var c = chain(c1, c2, c3)
    var onStep = jasmine.createSpy()
    var onComplete = jasmine.createSpy()
    it('will stop at first error step', function (done) {
        c({hello:'world'}, function (err) {
            expect(err).toEqual(jasmine.any(Error))
            expect(err.message).toEqual('error1')
            done()
        }).on('step', onStep).on('complete', onComplete)
    })
    it('will only emit step events up to the error step', function () {
        expect(onStep.callCount).toEqual(1)
    })
    it('will not emit a complete event', function () {
        expect(onComplete).not.toHaveBeenCalled()
    })
})
