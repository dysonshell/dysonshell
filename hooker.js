'use strict';
var params = require('fn-params');
var co = require('co');
module.exports = hooker;

function conext(g) {
    var cw = co.wrap(g);
    return function (req, res, next) {
        cw(req, res, next).catch(next);
    }
}

function hooker(plugin, router) {
    var __next = {
        next: true
    };

    function getDep(req, key) {
        var res = req.res;
        return {
            get next() {
                return __next;
            },
            get query() {
                return req.query;
            },
            get params() {
                return req.params;
            },
            get data() {
                return req.data;
            },
            get body() {
                return req.body;
            },
            get locals() {
                return res.locals;
            },
            get expose() {
                return function (keypath, obj) {
                    res.__expose[keypath] = obj;
                }
            },
            get format() {
                return format;
            },
            get redirect() {
                return function redirect(url, status) {
                    return {
                        __redirect: true,
                        url: url,
                        status: status || 302
                    };
                };
            }
        }[key];
    }
    var hook = {
        titles: function (titlePairs) {
            titlePairs.forEach(function (titlePair) {
                if (!Array.isArray(titlePair)) return;
                if (typeof titlePair[1] === 'string') {
                    router.all(titlePair, function (req, res, next) {
                        res.locals.title = titlePair[1];
                        next();
                    });
                }
            });
        },
        get: function (path, functionOrInjectList, fn) {
            var injectList;
            if (typeof functionOrInjectList === 'function') {
                fn = functionOrInjectList;
                injectList = params(functionOrInjectList);
            } else {
                injectList = functionOrInjectList;
            }
            router.get(path, conext(function *(req, res, next) {
                if (req.routerFactoryModule && req.routerFactoryModule !== router.factoryModule) {
                    return next(new Error('为避免冲突不能在不同的模块里处理相同的 url。冲突的 module：' +
                        req.routerFactoryModule.filename + ' vs ' + router.factoryModule.filename));
                }
                req.routerFactoryModule = router.factoryModule;
                res.__expose = res.__expose || {};
                var response = yield Promise.resolve(
                    fn.apply(null, injectList.map(getDep.bind(null, req))) || {});
                if (response === __next ||
                    response.next === true) {
                    return next();
                }
                if (response.redirect) {
                    if (Array.isArray(response.redirect)) {
                        return res.redirect(response.redirect[0], response.redirect[1]);
                    }
                    return res.redirect(302, response.redirect);
                }
                response = yield Promise.props(response);
                var exposed = yield Promise.props(res.__expose);
                Object.keys(exposed, function (key) {
                    res.expose(exposed[key], key);
                });
                res.locals = _.assign(res.locals, yield Promise.props(response.locals || {}));
                res.locals.title = res.locals.title || response.title;
                if (response.view === false) {
                    return res.json(res.locals);
                }
                if (response.layout === false) {
                    res.layout = false;
                }
                console.log(response);
                return response.view ?
                    res.render(response.view) :
                    res.render();
            }));
        },
    };
    plugin(hook);
}
