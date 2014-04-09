'use strict';

var _ = require('lodash');
var cloak = require('cloak');

var ListenTo = require('./listento');

module.exports = CloakRoomManager;

function CloakRoomManager() {
  ListenTo.apply(this, arguments);

  this.roomNameToId = {};
  this.roomIdToName = {};

  this._boundHandlers = null;
}

CloakRoomManager.prototype = Object.create(ListenTo.prototype);
CloakRoomManager.prototype.constructor = CloakRoomManager;

CloakRoomManager.prototype._listeningNames = {
  create: '_create',
  delete: '_delete'
};

CloakRoomManager.prototype.getRoomId = function(roomName) {
  return this.roomNameToId[roomName];
};

CloakRoomManager.prototype.getRoomName = function(roomId) {
  return this.roomIdToName[roomId];
};

// @returns {cloak.Room}
CloakRoomManager.prototype.byId = function(roomId) {
  return cloak.getRoom(roomId);
};

// @returns {cloak.Room}
CloakRoomManager.prototype.byName = function(roomName) {
  return cloak.getRoom(this.roomNameToId[roomName]);
};

CloakRoomManager.prototype._create = function(name) {
  var room = cloak.createRoom(name);
  this.roomNameToId[name] = room.id;
  this.roomIdToName[room.id] = name;
  this.emit('create', name, room);
};

CloakRoomManager.prototype._delete = function(name) {
  cloak.getRoom(this.roomNameToId[name]).delete();
  delete this.roomIdToName[this.roomNameToId[name]];
  delete this.roomNameToId[name];
  this.emit('delete', name);
};

CloakRoomManager.prototype._handlers = function() {
  if (!this._boundHandlers) {
    this._boundHandlers = ListenTo.bindNames(this, this._listeningNames);
  }
  return this._boundHandlers;
};

CloakRoomManager.prototype._stopCleanup = function() {
  // Delete all remaining rooms.
  _.each(this.roomIdToName, this._delete, this);
};
