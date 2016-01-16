'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV === 'development') {
    require('source-map-support').install();
}
var path = require('path');
var fs = require('fs');
require('ds-require');
var config = require('config');
var _ = require('lodash');
var express = require('express');
require('coexpress')(express);
var dsAssets = require('ds-assets');

var port = Number(process.env.PORT || config.port) || 4000;

var app =
exports.app =
    express();

var ds = require('./index');
app.disable('etag'); // set to be disabled by default, you can enable it if you really want
app.use(require('cookie-parser')());
ds.expose(app);
if (config.dsBackendUrlPrefix) {
    ds.request(app, config.dsBackendUrlPrefix);
}

var serveStatic = require('serve-static');
app.handle = (function (_handle) {
    var st = serveStatic(path.join(config.dsAppRoot));
    return function () {
        // these middlewares should be used in the end of all layers
        dsAssets.augmentApp(app);
        if (app.get('env') === 'development') {
            ds.watchify(app, port);
        } else {
            app.enable('view cache');
        }
        app.use(function (req, res, next) {
            if (req.path.match(/^\/ccc\/([^\/]+\/(css|js|img)\/|(global|common)-[^\/]+\.js$)/)) {
                st(req, res, next);
            } else {
                next();
            }
        });

        require('ds-render').augmentApp(app);

        var faviconPath = path.join(config.dsAppRoot, 'favicon.ico');
        if (fs.existsSync(faviconPath)) {
            app.use(require('express-favicon')(faviconPath));
        }

        app.handle = _handle;
        _handle.apply(app, arguments);
    };
}(app.handle));

exports.server =
app.httpServer =
    require('http').createServer(app);
