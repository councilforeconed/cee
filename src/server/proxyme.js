'use strict';

// Node core modules
var EventEmitter = require('events').EventEmitter;

// @export ProxyMe
module.exports = ProxyMe;

var slice = [].slice.call.bind([].slice);

// A small extension to EventEmitter behaviour that emits events normally than
// emits a special '*' event with the name of of the event as the first
// argument followed by the event's arguments.
function ProxyMe() {
  EventEmitter.call(this);
}

// @inherits {EventEmitter}
ProxyMe.prototype = Object.create(EventEmitter.prototype);
ProxyMe.prototype.constructor = ProxyMe;

// Store the normal emit for easy use.
ProxyMe.prototype._emit = EventEmitter.prototype.emit;

// Emit an event and then a special '*' event including the name of the
// original event as the first argument.
ProxyMe.prototype.emit = function() {
  this._emit.apply(this, arguments);

  var starArgs = slice(arguments);
  starArgs.unshift('*');
  this._emit.apply(this, starArgs);
};
