'use strict';

var path = require('path');
var fs = require('fs');
require('ds-require');
var config = require('config');
var _ = require('lodash');
var express = require('express');
require('coexpress')(express);

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

var dscPath = path.join(config.dsAppRoot, config.dsComponentPrefix);

app.handle = (function (_handle) {
    return function () {
        console.log(111);
        // these middlewares should be used in the end or all layers
        if (app.get('env') === 'development') {
            require('ds-pack').watchify(app, port);
        } else {
            app.enable('view cache');
        }

        require('ds-render').augmentApp(app);

        var ecstatic = require('ecstatic')({root: dscPath});
        app.use('/' + config.dsComponentPrefix, function (req, res, next) {
            if (req.url.match(/^\/[^\/]+\/(css|img|js)|^\/(global-)?common-[^\/]+\.js$/)) {
                ecstatic(req, res, next);
            } else {
                next();
            }
        });

        var faviconPath = path.join(dscPath, 'favicon.ico');
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
