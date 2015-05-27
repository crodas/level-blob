var writeStream = require('./write').writeStream;
var readStream  = require('./read').readStream;
var levelUp     = require('levelup')


function levelStore(levelup) {
    if (typeof levelup == "string") {
        levelup = levelUp(levelup, {writeBufferSize: 128*1024*1024, blockSize: 50*1024});
    }
    this._db = levelup;
}

levelStore.prototype.createReadStream = function(opts) {
    if (typeof opts === 'string') opts = {key:opts}
    if (opts.name && !opts.key) opts.key = opts.name

    return new readStream(this._db, opts.key);
};

levelStore.prototype.exists = function(opts, cb) {
    if (typeof opts === 'string') opts = {key:opts}
    if (opts.name && !opts.key) opts.key = opts.name

    this._db.get(opts.key, function(err, data) {
        cb(null, err == null);
    });
};

levelStore.prototype.remove = function(opts, cb) {
    if (typeof opts === 'string') opts = {key:opts}
    if (opts.name && !opts.key) opts.key = opts.name
    this._db.del(opts.key, cb);
    return this
};

levelStore.prototype.createWriteStream = function(opts, cb) {
    if (typeof opts === 'string') opts = {key:opts}
    if (opts.name && !opts.key) opts.key = opts.name
    var stream =  new writeStream(this._db, opts);
    stream.on('end', cb);
    return stream;
};

module.exports = function(levelup) {
    return new levelStore(levelup)
};
