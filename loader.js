'use strict';
var path = require('path');
var fs = require('fs');
var cccglob = require('@ds/cccglob');
var log = require('bunyan-hub-logger')({app: 'web', name: 'loader'});
var express = require('express');
var hooker = require('./hooker');

module.exports = function load(app) {
    cccglob.sync('ccc/*/router.js').forEach(function (routerName) {
        var routerPath = require.resolve(routerName);
        log.trace('loading router ' + routerPath);
        var routerFactory = require(routerName);
        if (routerFactory.loaded) {
            return;
        }
        var routerModule = require.cache[routerPath];
        var router = express();
        // TODO: check router conflicts
        /*
        router.use(function (req, res, next) {
            if (req.routerFactoryModule) {
                return next(new Error('为避免冲突不能在不同的模块里处理相同的 url。冲突的 module：' +
                    req.routerFactoryModule.filename + ' vs ' + routerPath));
            }
            req.routerFactoryModule = routerModule;
            next();
        });
        */
        routerFactory(router);
        var hookPath = path.join(path.dirname(routerPath), 'hook.js');
        if (fs.existsSync(hookPath)) {
            log.trace('loading hook ' + hookPath);
            var hook = require(hookPath);
            hooker(hook, router);
            hook.loaded = true;
        }
        app.use(router);
    });
    cccglob.sync('ccc/*/hook.js').forEach(function (hookName) {
        var hookPath = require.resolve(hookName);
        log.trace('loading hook ' + hookPath);
        var hook = require(hookPath);
        if (hook.loaded) {
            return;
        }
        var routerModule = require.cache[hookPath];
        var router = express();
        router.factoryModule = routerModule;
        hooker(hook, router);
        hook.loaded = true;
        app.use(router);
    });
    app.use(function (req, res, next) {
        delete req.routerFactoryModule; // clear for @ds/render to auto resolve view path
        next();
    });
};
