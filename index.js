'use strict';
var path = require('path');
var express = require('express');
var expstate = require('express-state');

exports.createApp = function (appRoot) {
    var app = express();
    expstate.extend(app);
    app.set('state namespace', 'CC');
    app.set('views', path.join(appRoot, 'views'));
    return app;
};

exports.createSubApp = function (subAppRoot) {
    var subApp = express();
    subApp.on('mount', function (app) {
        subApp.set('views', [path.join(subAppRoot, 'views')].concat(app.get('views')));
    });
};