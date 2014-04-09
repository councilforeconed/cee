'use strict';

var EventEmitter = require('events').EventEmitter;

var assert = require('chai').assert;
var sinon = require('sinon');

var ListenTo = require('../../src/server/listento');

suite('ListenTo', function() {
  var Cls;
  var events;
  var emitter;
  var instance;

  setup(function() {
    Cls = function Cls() {};
    ListenTo.mixin(Cls);
    Cls.prototype._handlers = function() {
      if (!this._boundHandlers) {
        this._boundHandlers = ListenTo.bindNames(this, events);
      }
      return this._boundHandlers;
    };
    Cls.prototype.doSomething = sinon.spy();

    events = { 'somethingHappened': 'doSomething' };

    emitter = new EventEmitter();
    instance = new Cls();
  });

  test('bindNames', function() {
    var handlers = instance._handlers();

    handlers.somethingHappened();
    assert.ok(instance.doSomething.calledOnce);
    assert.equal(instance.doSomething.thisValues[0], instance);
  });

  test('listenTo', function() {
    instance.listenTo(emitter);

    emitter.emit('somethingHappened');
    assert.ok(instance.doSomething.calledOnce);
    assert.equal(instance.doSomething.thisValues[0], instance);
  });

  test('stopListening', function() {
    instance.listenTo(emitter);

    emitter.emit('somethingHappened');
    assert.ok(instance.doSomething.calledOnce);
    assert.equal(instance.doSomething.thisValues[0], instance);

    instance.stopListening();

    emitter.emit('somethingHappened');
    assert.ok(instance.doSomething.calledOnce);
  });
});
