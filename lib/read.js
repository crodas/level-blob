var Stream = require('stream').Readable;
var Util   = require('util');
var Async  = require('async');

function readStream(db, path, options) {
    Stream.call(this);
    options = options || {};
    this.readable = true;
    this.writable = false;
    this._db     = db;
    this._key    = path;
    this._ready  = false;
    this._start  = options.start || 0;
    var that = this;
    this._db.get(path, function(err, data) {
        if (err || !data) {
            that._error(err);
            that = null;
            return;
        }
        var data = JSON.parse(data);
        that._size   = data.size;
        that._blocks = data.blocks;
        that._ready = true;
        that._end  = options.end || data.size;
        that._prepare();
        that = null;
    }); 
};

Util.inherits(readStream, Stream);

readStream.prototype._read = function() {
    if (!this._ready) {
        this._begin = true;
        return;
    }
    if (this._failed || this._toread.length == 0) {
        return this.push(null);
    }

    var that = this;
    that._db.get(this._toread.shift(), {valueEncoding: 'binary'}, function(err, data) {
        that.push(data);
    });
};

readStream.prototype._error = function(str) {
    this.emit("error", str);
    this._failed = true;
    return this;
};

readStream.prototype._streamAll = function() {
    this._toread = [];
    for (var i = 0; i < this._blocks.length; i++) {
        this._toread.push(this._key + "." + i);
    }
};

readStream.prototype._prepare = function() {
    if (this._start == 0 && this._end == this._size) {
        this._streamAll();
    }
    if (this._begin) {
        this._read();
    }
};

exports.readStream = readStream;
