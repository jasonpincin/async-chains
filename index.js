var EventEmitter = require('events').EventEmitter

function chain () {
    var steps
    var entry = function () {
        var self     = this
        ,   args     = Array.prototype.slice.apply(arguments)
        ,   callback = typeof args[args.length - 1] === 'function' ? args.pop() : function () {}
        ,   evt      = new EventEmitter()
        ,   step     = -1

        var next     = function () {
            var stepargs = Array.prototype.slice.apply(arguments)
            ,   steperr  = stepargs.shift()
            process.nextTick(function () {
                step++
                if (steperr) 
                    callback(steperr)
                else if (step === steps.length) {
                    callback.apply(self, [steperr].concat(stepargs))
                    evt.emit('complete', [steperr].concat(stepargs))
                }
                else {
                    evt.emit('step', step, [steperr].concat(stepargs))
                    steps[step].apply(self, stepargs.concat([next]))
                }
            })
        }
        next.apply(self, [null].concat(args))
        return evt
    }
    entry.steps = steps = Array.prototype.slice.apply(arguments)
    return entry
}
chain.link = function () {
    var self = this
    ,   args = Array.prototype.slice.apply(arguments)
    ,   tf   = args.shift()
    return function () {
        var fargs = Array.prototype.slice.apply(arguments)
        ,   data  = fargs.shift()
        return tf.apply(self, [data].concat(args).concat(fargs))
    }
}
chain.link.noError = function () {
    var self = this
    ,   args = Array.prototype.slice.apply(arguments)
    ,   tf   = args.shift()
    return function () {
        var fargs = Array.prototype.slice.apply(arguments)
        ,   data  = fargs.shift()
        ,   cb    = fargs.pop()
        return tf.apply(self, [data].concat(args).concat(fargs).concat(function (result) {
            cb(null, result)
        }))
    }
}
chain.to = function (fn, callback) {
    var self = this
    return function () {
        var args = Array.prototype.slice.apply(arguments)
        ,   err  = args.shift()
        if (err)
            callback(err)
        else
            fn.apply(self, args.concat([callback]))
    }
}
module.exports = chain
