'use strict';
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var dsGlob = require('ds-glob');
var express = require('express');
var config = require('config');
assert(config.dsAppRoot);
// config
var APP_ROOT = config.dsAppRoot;
var DSC = config.dsComponentPrefix || 'dsc';
var DSCns = DSC.replace(/^\/+/, '').replace(/\/+$/, '');
DSC = DSCns + '/';

module.exports = function load(routerPrefix) {
    var exportRouter = express.Router();
    dsGlob.sync(DSC + '*/routers/'+routerPrefix+'.js').forEach(function (routerName) {
        console.log('loading router from file "' + routerName + '"');
        var routerPath = require.resolve(routerName);
        var routerFactory = require(routerName);
        var routerModule = require.cache[routerPath];
        var router = express.Router();
        router.factoryModule = routerModule;
        router.use(addRouterFactory(routerModule));
        routerFactory(router);
        router.use(removeRouterFactory());
        var prefix = '/' + getComponentName(routerPath);
        if (prefix === '/index') {
            exportRouter.use(router);
        }
        exportRouter.use(prefix, router);
    });
    return exportRouter;
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
