'use strict';

var EventEmitter = require('events').EventEmitter;

module.exports = ProxyMe;

var slice = [].slice.call.bind([].slice);

function ProxyMe() {
  EventEmitter.call(this);
}

ProxyMe.prototype = Object.create(EventEmitter.prototype);
ProxyMe.prototype.constructor = ProxyMe;

ProxyMe.prototype._emit = EventEmitter.prototype.emit;
ProxyMe.prototype.emit = function() {
  this._emit.apply(this, arguments);

  var starArgs = slice(arguments);
  starArgs.unshift('*');
  this._emit.apply(this, starArgs);
};
