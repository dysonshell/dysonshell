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
        var router = express.Router();
        router.factoryModule = routerModule;
        router.use(addRouterFactory(routerModule));
        routerFactory(router);
        var hookPath = path.join(path.dirname(routerPath), 'hook.js');
        if (fs.existsSync(hookPath)) {
            log.trace('loading hook ' + hookPath);
            var hook = require(hookPath);
            router.factoryModule = require.cache[hookPath];
            hooker(hook, router);
            hook.loaded = true;
        }
        router.use(removeRouterFactory());
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
        var router = express.Router();
        router.factoryModule = routerModule;
        router.use(addRouterFactory(routerModule));
        hooker(hook, router);
        router.use(removeRouterFactory());
        hook.loaded = true;
        app.use(router);
    });
};

function addRouterFactory(factoryModule) {
    return function (req, res, next) {
        req.routerFactoryModule = factoryModule;
        next();
    };
}

function removeRouterFactory() {
    return function (req, res, next) {
        delete req.routerFactoryModule; // clear for @ds/render to auto resolve view path
        next();
    };
}

function getComponentName(componentPath) {
console.log(arguments);
    var componentRelativePath = componentPath.replace(/.*\/@?ccc\//, '');
    var componentName = componentRelativePath.split('/')[0];
    console.log(componentName);
    return componentName;
}

function getPrefixFromComponentName(componentName) {
console.log(arguments);
    var dirs = componentName.split('__');
    var lastDir = dirs.pop();
    if (lastDir && lastDir !== 'index') {
        dirs.push(lastDir);
    }
    var prefix = dirs.join('/');
    if (prefix[0] !== '/') {
        prefix = '/' + prefix;
    }
    if (prefix[prefix.length - 1] !== '/') {
        prefix = prefix + '/';
    }
    console.log(prefix);
    return prefix;
}
