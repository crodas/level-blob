var abstractBlobTests = require('abstract-blob-store/tests')
var Store = require('./lib/store')("./blobs")
var test = require('tape')

var common = {
    setup: function(t, cb) {
        cb(null, Store)
    },
    teardown: function(t, store, blob, cb) {
        if (blob) store.remove(blob, cb)
        else cb()
    }
}


abstractBlobTests(test, common)
