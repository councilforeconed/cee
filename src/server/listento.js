'use strict';

var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

module.exports = ListenTo;

// Abstract class for listening to an emitter.
function ListenTo() {
  EventEmitter.apply(this, arguments);
  this._listeningTo = null;
}

ListenTo.prototype = Object.create(EventEmitter.prototype);
ListenTo.prototype.constructor = ListenTo;

// Given an object return an object with the values replaced with
// bound methods of this.
ListenTo.prototype._bindNames = function(names) {
  return _.mapValues(names, function(value) {
    return this[value].bind(this);
  }, this);
};

// @abstract
ListenTo.prototype._handlers = function() {};

// @abstract
ListenTo.prototype._stopCleanup = function() {};

ListenTo.prototype.listenTo = function(emitter) {
  this.stopListening();

  this._listeningTo = emitter;
  var handlers = this._handlers();
  _.each(
    _.pairs(handlers),
    emitter.on.apply.bind(emitter.on, emitter)
  );
};

ListenTo.prototype.stopListening = function() {
  var emitter = this._listeningTo;
  if (!emitter) {
    return;
  }

  var handlers = this._handlers();
  _.each(
    _.pairs(handlers),
    emitter.removeListener.apply.bind(emitter.removeListener, emitter)
  );

  if (typeof this._stopCleanup === 'function') {
    this._stopCleanup();
  }
};

ListenTo.bindNames = function(ctx, names) {
  return ListenTo.prototype._bindNames.call(ctx, names);
};

ListenTo.mixin = function(cls) {
  cls.prototype.listenTo = ListenTo.prototype.listenTo;
  cls.prototype.stopListening = ListenTo.prototype.stopListening;
  return cls;
};
