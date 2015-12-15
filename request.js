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

        if (allowCookie !== false && Object.keys(req.cookies).length) {
            if (allowCookie === true) {
                headers.Cookie = req.cookies;
            } else if (Array.isArray(allowCookie)) {
                var cookies = {};
                _.each(req.cookies, function (value, key) {
                    if (allowCookie.indexOf(key) > -1) {
                        cookies[key] = value;
                    }
                });
                if (Object.keys(cookies)) {
                    headers.Cookie = cookies;
                }
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
