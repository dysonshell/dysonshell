'use strict';
var path = require('path');
var fs = require('fs');
var cccglob = require('@ds/cccglob');
var log = require('bunyan-hub-logger')({app: 'web', name: 'loader'});
var express = require('express');
var hooker = require('./hooker');
var methods = require('methods');
var env = process.env.NODE_ENV || 'development';
var isUat = process.env.NODE_APP_INSTANCE === 'uat';

function createRouter(routerModule) {
    var router = express.Router();
    router.use = function () {
        throw new Error('因为 ccc/*/router.js 的加载顺序不定，不能在这里使用 router.use() 方法，请在 web/index.js 的 dsBase.load() 之前添加全局 middleware');
    };
    methods.concat('all').forEach(function(m){
        if (env === 'production' && !isUat) {
            return router[m];
        }
        router[m] = (function(origMethod) {
            return function () {
                origMethod.call(this, function (req, res, next) {

                    // check router conflicts
                    if (req.routerFactoryModule && routerModule.filename !== req.routerFactoryModule.filename) {
                        return next(new Error(
                            '为避免冲突不能在不同的模块里处理相同的 url。冲突的 module：' +
                            req.routerFactoryModule.filename + ' vs ' + routerModule.filename));
                    }
                    req.routerFactoryModule = routerModule;
                    next();
                });
                return origMethod.apply(this, arguments);
            };
        }(router[m]));
    });
    return router;
}

module.exports = function load(app) {
    cccglob.sync('ccc/*/router.js').forEach(function (routerName) {
        var routerPath = require.resolve(routerName);
        log.trace('loading router ' + routerPath);
        var routerFactory = require(routerName);
        var routerModule = require.cache[routerPath];
        var router = createRouter(routerModule);
        routerFactory(router);
        var hookPath = path.join(path.dirname(routerPath), 'hook.js');
        app.use(router);
        if (fs.existsSync(hookPath)) {
            log.trace('loading hook ' + hookPath);
            var hook = require(hookPath);
            var router = createRouter(require.cache[hookPath]);
            hooker(hook, router);
            app.use(router);
            hook.loaded = true;
        }
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
