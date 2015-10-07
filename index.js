"use strict";

var Readable = require('stream').Readable;
var spawn = require('child_process').spawn;
var util = require('util');
var zlib = require('zlib');

util.inherits(Mysqldump, Readable);

function Mysqldump(database, options) {
  if(!(this instanceof Mysqldump)) {
    return new Mysqldump(database, options);
  }
  var LIMIT = 1048576;
  var self = this, alldb = false;
  this.mysqldump = null;
  this.stdout = null;
  this.dump_buf = null;
  Readable.call(this);
  if('string' !== typeof database) {
    options = database;
    alldb = true;
  }
  var opts = {
    host: options.host || 'localhost',
    port: options.port || 3306,
    user: options.user || process.env.USER || 'root',
    password: options.password || false,
    gzip: options.gzip || false
  }
  this.dump = this.start = this.run = this.make = function() {
    var params = ['-h', opts.host,'-P', opts.port, '-u', opts.user];
    var gzip;
    if(opts.password !== false) {
      params = params.concat(['-p'+opts.password]);
    }
    if(alldb) {
      params.push('--all-databases');
    } else {
      params.push(database);
    }
    if(options.gzip) {
      gzip = new zlib.createGzip();
    }
    this.dump_buf = new Buffer(0);
    this.mysqldump = spawn('mysqldump', params);
    this.mysqldump.stderr.on('data', function(data){
      self.emit('error', new Error(data));
    })
    if(options.gzip) {
      this.stdout = this.mysqldump.stdout.pipe(gzip);
    } else {
      this.stdout = this.mysqldump.stdout;
    }
    this.stdout.on('data', function(data) {
      if(data) {
        self.dump_buf = Buffer.concat([self.dump_buf, data]);
        if(self.dump_buf.length >= LIMIT) {
          self.stdout.pause();
        }
        self.read(0);
      }
    });
    this.mysqldump.on('close', function() {
      self.dump_buf = null;
      self.mysqldump = null;
      self.push(null);
    });
    return self;
  };
};

Mysqldump.prototype._read = function(n) {
  var data = '';
  var self = this;
  if(this.dump_buf.length > 0) {
    data = this.dump_buf.slice(0, n);
    if(n >= this.dump_buf.length) {
      this.dump_buf = new Buffer(0);
    } else {
      var tmp = new Buffer(this.dump_buf.length - n);
      this.dump_buf.copy(tmp, 0, n);
      this.dump_buf = tmp;
    }
    if(this.stdout.isPaused()) {
      this.stdout.resume();
    }
  }
  return this.push(data);
};

module.exports = Mysqldump;
