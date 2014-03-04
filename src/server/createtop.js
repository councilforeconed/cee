// @file Top server. Manages processes for sub servers and routes static traffic

'use strict';

// Third party libs.
var _debug = require('debug')('cee');
var express = require('express');
var when = require('when');
var whenNode = require('when/node/function');
var jade = require('jade');
var _ = require('lodash');

// Locally defined libs.
var ServerManager = require('./servermanager');
var whenListening = require('./common').whenListening;
var getActivities = require('./get-activities');

// Start a server and return a promise of when that server is ready.
//
// @param {object} options
//   - port port to server on
//   - hostname hostname to attach to (eg. '0.0.0.0')
//   - scriptFilter function to filter scripts with
// @param debug debug module instance to use
// @returns {Promise} promise for server
module.exports.createTop = function(options, debug) {
  options = options || {};
  // debug instances iterate the color value even if they share the name of
  // another instance, so passing an instance around is the only way to
  // maintain that color value.
  debug = debug || _debug;

  // Create the manager instance.
  var manager = new ServerManager();

  // Find scripts to boot, then launch those with the manager instance.
  var whenChildren = getActivities()
    .then(function(activities) {
      var scripts = _.pluck(activities, 'serverIndex');
      if (options.scriptFilter) {
        scripts = scripts.filter(options.scriptFilter);
      }

      return when.map(scripts, function(script) {
        var name = /src\/activities\/([-\w]+)\/index.js/.exec(script)[1];
        return manager.launch(name, script);
      });
    })
    .then(function() {debug('all children are ready');})
    .catch(function(e) {
      // Log error, then re-throw.
      console.error(e.stack || e);
      throw e;
    });

  // Create the express application.
  var app = express();
  var indexData;
  var staticDir;

  // Route normal web traffic to /activities/:name to children.
  app.all('/activities/:name*', function(req, res, next) {
    // Edit the url that the child server sees. /activities/:name/status
    // becomes /status.
    req.url = req.params[0] || '/';
    manager.proxyWeb(req.params.name, [req, res]);
  });

  app.set('view engine', 'jade');
  app.set('views', 'src/client');

  app.configure('development', function() {
    staticDir = 'src';
    app.use('/static/bower_components', express.static('bower_components'));
  });

  app.configure('production', function() {
    staticDir = 'out';
    app.use('/static/bower_components', express.static(staticDir + '/bower_components'));
  });

  app.use('/static/activities', express.static(staticDir + '/activities'));
  app.use('/static', express.static(staticDir + '/client'));
  // In order to properly support pushState, serve the index HTML file for
  // GET requests to any directory.
  var indexRouteReady = getActivities().then(function(activityData) {
    app.get(/\/$/, function(req, res) {
      res.render('index.jade', {
        dev: staticDir === 'src',
        activities: activityData
      });
      res.end();
    });
  });

  app.get('/status', function(req, res, next) {
    res.send(200, 'ok');
  });

  // Start listening. By default let the kernel gives us a port. But otherwise
  // a port can be specified.
  var server = app.listen(options.port || 0, options.hostname);

  // Use the server's close method as a hook to kill the sub servers.
  (function() {
    var _close = server.close;
    server.close = function(cb) {
      return manager.killAll()
        .yield(whenNode.call(_close.bind(server)))
        .then(function() {debug('all children are stopped');})
        .always(cb);
    };
  }());

  // Websockets use the upgrade path. Figure out which sub to proxy to.
  server.on('upgrade', function(req, socket, head) {
    // TODO: Some of this could be replaced with a specialty express app
    // for websocket connections that would be able to use express's
    // path matching.
    var match = /\/activities\/([-\w]+)(.*)/.exec(req.url);
    var name = match[1];
    var newUrl = match[2];
    req.url = newUrl;
    manager.proxyWs(name, [req, socket, head]);
  });

  // Wait for everything to set up that can.
  return when
    .all([
      indexRouteReady,
      // When the server is listening.
      whenListening(server, debug),
      // Wait for the children.
      whenChildren
    ])
    // If any error occured, tear everything down.
    .catch(function(e) {
      return whenChildren
        .then(manager.killAll.bind(manager))
        .then(function() {
          throw e;
        });
    })
    // Yield the server for further work outside of serve().
    .yield(server);
};
