'use strict';
var path = require('path');
var fs = require('fs');
var cccglob = require('@ds/cccglob');
var log = require('bunyan-hub-logger')({app: 'web', name: 'loader'});
var express = require('express');
var hooker = require('./hooker');
var methods = [
    "checkout",
    "connect",
    "copy",
    "delete",
    "get",
    "head",
    "lock",
    "m-search",
    "merge",
    "mkactivity",
    "mkcol",
    "move",
    "notify",
    "options",
    "patch",
    "post",
    "propfind",
    "proppatch",
    "purge",
    "put",
    "report",
    "search",
    "subscribe",
    "trace",
    "unlock",
    "unsubscribe"
];
var env = process.env.NODE_ENV || 'development';
var isUat = process.env.NODE_APP_INSTANCE === 'uat';

function createRouter(routerModule) {
    var router = express.Router();
    var routerPath = routerModule.filename;
    var prefix = getPrefixFromComponentName(getComponentName(routerPath));
    router._use = router.use;
    router.use = function () {
        throw new Error('因为 ccc/*/router.js 的加载顺序不定，不能在这里使用 router.use() 方法，请在 web/index.js 的 dsBase.load() 之前添加全局 middleware');
    };
    methods.concat('all').forEach(function(m){
        router[m] = (function(origMethod) {
            return function (routePath) {
                if (typeof routePath !== 'string' && !(routePath instanceof RegExp)) {
                    throw new Error('router/hook path 必须为字符串或正则表达式');
                }
                var args = [].slice.apply(arguments);
                var dreg = /^(\/*)\./;
                var startedWithDot = typeof routePath !== 'string' && routePath.match(dreg);
                routePath = routePath.replace(dreg, '$1');
                if (env === 'production' && !isUat) {
                    // 生产环境不限制前缀（假设开发和测试已经保证没问题）
                    // 并且不显示 /. 开头的路径
                    if (!startedWithDot) {
                        origMethod.apply(this, args);
                    }
                    return;
                }
                if ((routePath instanceof RegExp && !(prefix + '/').match(routePath)) || // RegExp 默认是匹配 /xxx/* 的
                    (typeof routePath === 'string' && (!(routePath.indexOf(prefix) === 0 && // 匹配 /xxx 与 /xxx/*
                        (!routePath[prefix.length] || routePath[prefix.length] === '/'))))) {
                    throw new Error('只能在 router.js 和 hook.js 里设置对应该模块的路径，如 ccc/login 只能设置 /login 或 /login/* 路径，而 ccc/account__payment 只能设置 /account/payment 或 /account/payment/* （双下划线转换成 /）');
                }
                return origMethod.apply(this, args);
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
        router.factoryModule = routerModule;
        router._use(addRouterFactory(routerModule));
        routerFactory(router);
        var hookPath = path.join(path.dirname(routerPath), 'hook.js');
        if (fs.existsSync(hookPath)) {
            log.trace('loading hook ' + hookPath);
            var hook = require(hookPath);
            hooker(hook, router);
            hook.loaded = true;
        }
        router._use(removeRouterFactory());
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
        var router = createRouter(routerModule);
        router.factoryModule = routerModule;
        router._use(addRouterFactory(routerModule));
        hooker(hook, router);
        router._use(removeRouterFactory());
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
    var componentRelativePath = componentPath.replace(/.*\/@?ccc\//, '');
    var componentName = componentRelativePath.split('/')[0];
    return componentName;
}

function getPrefixFromComponentName(componentName) {
    var dirs = componentName.split('__');
    var lastDir = dirs.pop();
    if (lastDir && lastDir !== 'index') {
        dirs.push(lastDir);
    }
    var prefix = dirs.join('/');
    prefix = prefix.replace(/\/+$/, '');
    if (prefix[0] !== '/') {
        prefix = '/' + prefix;
    }
    return prefix;
}
