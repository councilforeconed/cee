'use strict';

var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var ProxyMe = require('./proxyme');

module.exports = ListenTo;

// Abstract class for listening to an emitter.
function ListenTo(listenerNames) {
  ProxyMe.call(this);

  this._listeningTo = null;
  this._listeningEmitter = new EventEmitter();
  this._listeningHandler = null;

  if (listenerNames) {
    _.each(ListenTo.bindNames(this, listenerNames), function(handle, event) {
      this._listeningEmitter.on(event, handle);
    }, this);
  }
}

ListenTo.prototype = Object.create(ProxyMe.prototype);
ListenTo.prototype.constructor = ListenTo;

ListenTo.prototype.listenTo = function(emitter) {
  this.stopListening();

  if (!this._listeningHandler) {
    this._listeningHandler =
      this._listeningEmitter.emit.call.bind(
        this._listeningEmitter.emit,
        this._listeningEmitter
      );
  }
  this._listeningTo = emitter;
  this._listeningTo.on('*', this._listeningHandler);
};

ListenTo.prototype.stopListening = function() {
  if (this._listeningTo) {
    this._listeningTo.removeListener('*', this._listeningHandler);
  }
};

ListenTo.bindNames = function(ctx, names) {
  if (Array.isArray(names)) {
    var result = {};
    _.each(names, function(value) {
      result[value] = ctx[value].bind(ctx);
    }, ctx);
    return result;
  } else {
    return _.mapValues(names, function(value) {
      return ctx[value].bind(ctx);
    }, ctx);
  }
};
