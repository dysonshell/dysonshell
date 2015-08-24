'use strict';
var params = require('fn-params');
var ccBody = require('cc-body');
var co = require('co');
var conext = require('conext');
module.exports = hooker;

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
            get reqQuery() {
                return req.query;
            },
            get reqParams() {
                return req.params;
            },
            get reqPath() {
                return req.path;
            },
            get query() {
                return req.query;
            },
            get params() {
                return req.params;
            },
            get fetch() {
                return req.fetch;
            },
            get request() {
                return req.uest;
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
            get redirect() {
                return function redirect(url, status) {
                    return { redirect: !!Number(status) ? [status, url] : url };
                };
            }
        }[key];
    }
    var hook = {
        titles: function (titlePairs) {
            titlePairs.forEach(function (titlePair) {
                if (!Array.isArray(titlePair)) return;
                if (typeof titlePair[1] === 'string') {
                    router.all(titlePair[0], function (req, res, next) {
                        res.locals.title = titlePair[1];
                        next();
                    });
                }
            });
        },
    };
    'get post put delete patch'.split(' ').forEach(function (method) {
        hook[method] = function (path, functionOrInjectList, fn) {
            var injectList;
            if (typeof functionOrInjectList === 'function') {
                fn = functionOrInjectList;
                injectList = params(functionOrInjectList);
            } else {
                injectList = functionOrInjectList;
            }
            var middlewares = [path, ];
            if (method !== 'get') {
                middlewares.push(ccBody);
            }
            middlewares.push(conext(function *(req, res, next) {
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
                //res.expose(exposed[key], key);
                res.locals = _.assign(res.locals, yield Promise.props(response.locals || {}));
                var exposed = yield Promise.props(res.__expose);
                Object.keys(exposed).forEach(function (key) {
                    res.expose(exposed[key], key);
                });
                res.locals.title = res.locals.title || response.title;
                if (response.view === false) {
                    return res.json(res.locals);
                }
                if (response.layout === false) {
                    res.layout = false;
                } else if (typeof response.layout === 'string') {
                    res.layout = response.layout;
                }
                return response.view ?
                    res.render(response.view) :
                    res.render();
            }));
            router[method].apply(router, middlewares);
        };
    });
    plugin(hook);
}
