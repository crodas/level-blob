var Stream = require('stream').Readable;
var Util   = require('util');
var Crypto = require('crypto');

function writeStream(db, metadata) {
    Stream.call(this);
    this.readable = false;
    this.writable = true;
    this.blockSize = metadata.blockSize || 256*1024;
    this.blockSize = metadata.blockSize || 4*1024;
    this._nBlocks = 0;
    this.shasum   = Crypto.createHash('sha256');
    this._blocks  = [];
    this._key     = metadata.key;
    this._db      = db;
    this._size    = 0;
    this._metadata = metadata;
    this.buffer   = { 
        mem: new Buffer(this.blockSize),
        offset: 0,
    };
}

Util.inherits(writeStream, Stream);

writeStream.prototype._end = function() {
    if (this._closing) {
        return;
    }
    this._closing = true;
    var that = this;
    this._metadata.size = this._size;
    this._metadata.blocks = this._blocks;
    this._metadata.shasum = this.shasum.digest('hex');
    this._db.put(this._key, JSON.stringify(this._metadata), function() {
        that.emit("close");
        that.emit("end", null, that._metadata);
        that = null;
    });
};

writeStream.prototype._flush = function() {
    if (this.buffer.offset <= 0) {
        if (this.closing) {
            this._end();
        }
        return;
    }
    var nBuffer = new Buffer(this.buffer.offset);
    /* reset memory buffer */
    this.buffer.mem.copy(nBuffer, 0, 0, this.buffer.offset);
    this.buffer.offset = 0;

    this.shasum.update(nBuffer);

    /* Write chunk */
    this._db.put(this._key + "." + (this._nBlocks++), nBuffer, this._error_handler.bind(this));

    /* Some local stats */
    this._blocks.push([this._size, nBuffer.length + this._size]);
    this._size += nBuffer.length;
};

writeStream.prototype._error_handler = function() {
    if (this.closing) {
        this._end();
    }
};

writeStream.prototype.write = function(buffer) {
    if (this.buffer.offset  + buffer.length < this.buffer.mem.length) {
        buffer.copy(this.buffer.mem, this.buffer.offset);
        this.buffer.offset += buffer.length;
    } else {
        var offset = this.buffer.mem.length - this.buffer.offset;
        buffer.copy(this.buffer.mem, this.buffer.offset, 0, offset);
        this.buffer.offset = this.buffer.mem.length;
        this._flush();
        if (offset != buffer.length) {
            this.write(buffer.slice(offset));
        }
    }

};

writeStream.prototype.end = function() {
    this.closing = true;
    this._flush();
};

exports.writeStream = writeStream;
