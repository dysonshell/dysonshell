'use strict';
var path = require('path');
var fs = require('fs');
var dsGlob = require('ds-glob');
var log = require('bunyan-hub-logger')({app: 'web', name: 'loader'});
var express = require('express');

module.exports = function load(app) {
    dsGlob.sync(DSC + '*/router.js').forEach(function (routerName) {
        var routerPath = require.resolve(routerName);
        log.trace('loading router ' + routerPath);
        var routerFactory = require(routerName);
        var routerModule = require.cache[routerPath];
        var router = express.Router();
        router.factoryModule = routerModule;
        router.use(addRouterFactory(routerModule));
        routerFactory(router);
        router.use(removeRouterFactory());
        var prefix = '/' + getComponentName(routerPath);
        app.use(prefix, router);
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
    var componentRelativePath = componentPath.replace(new RegExp('\/.*\\\/@?'+DSCns+'\\\/'), '');
    var componentName = componentRelativePath.split('/')[0];
    return componentName;
}
