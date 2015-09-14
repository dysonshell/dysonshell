'use strict';
require('http').globalAgent.maxSockets = Infinity
require('https').globalAgent.maxSockets = Infinity
var proagent = require('promisingagent');

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
        if (req.cookies.ccat) {
            headers.Authorization = 'Bearer ' + req.cookies.ccat;
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
