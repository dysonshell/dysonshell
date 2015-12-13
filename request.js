'use strict';
require('http').globalAgent.maxSockets = Infinity
require('https').globalAgent.maxSockets = Infinity
var proagent = require('promisingagent');
var config = require('config');
var allowCookie = config.dsRequestAllowCookie || ['dsat'];
var pairSplitRegExp = /; */;

module.exports = function expose(app, urlBackend) {
    app.use(require('cookie-parser')());
    app.use(function (req, res, next) {
        var ips = [];
        if (req.ip && req.ip.indexOf('127.0.0.1') === -1) ips.push(req.ip);
        if (req.ips && Array.isArray(req.ips)) {
          ips = ips.concat(req.ips[0] == req.ip ? req.ips.slice(1) : req.ips);
        }
        var headers = {};
        headers['X-Forwarded-For'] = ips.join(', ');
        var cookiePairs;
        if (allowCookie !== false && req.headers.cookie) {
            cookiePairs = req.headers.cookie.split(pairSplitRegExp);
        }
        if (cookiePairs) {
            if (allowCookie === true) {
                headers['set-cookie'] = cookiePairs;
            } else if (Array.isArray(allowCookie)) {
                headers['set-cookie'] = cookiePairs.filter(function (cookieStr) {
                    return allowCookie.some(function (ac) {
                        cookieStr.indexOf(ac + '=') === 0;
                    });
                })
            }
        }
        if (req.header('Authorization')) {
            headers.Authorization = req.header('Authorization');
        }
        req.uest = proagent.extend(urlBackend.replace(/\/+$/, ''), {
            headers: headers,
        });
        next();
    });
};
