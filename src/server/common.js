// @file common server code

'use strict';

var _ = require('lodash');
var debug = require('debug')('cee:common');
var when = require('when');
var whenParallel = require('when/parallel');
var whenTimeout = require('when/timeout');

// List of function handles to execute in parallel when a TERMINATE-like signal
// is received.
var _atTermination = [];

// Attach handler to TERMINATE-like signals once.
var attachSigInt = _.once(function(debug) {
  var atexit = _.once(function() {
    debug('exiting ...');
    // Execute handles in parallel. Reject in 5 seconds.
    whenTimeout(whenParallel(_atTermination), 5000)
      // Exit once all termination handles have resolved their promises.
      .then(process.exit.bind(process, 0), process.exit.bind(process, 1));
  });

  process.on('SIGHUP', atexit);
  process.on('SIGINT', atexit);
  process.on('SIGTERM', atexit);
});

// Add a termination handle.
module.exports.atTermination = function(fn, debug) {
  _atTermination.push(fn);
  attachSigInt(debug);
};

// Return a promise that resolves when the server begins listening or rejects
// if it errors before that.
//
// @param server Server object to attach listening handler to
// @param debug debug module instance for more straight forward debug messages
// @returns {Promise} Promise that resolves when server is listening
module.exports.whenListening = function(server, debug) {
  return when.promise(function(resolve, reject) {
    server.on('listening', function() {
      debug('listening on %d', server.address().port);
      resolve(server);
    });

    server.on('error', function(e) {
      reject(e);
    });
  });
};
