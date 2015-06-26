'use strict';
var httpProxy = require('http-proxy');
var url = require('url');

module.exports = function expose(app, urlBackend, namespace) {
    if (typeof urlBackend !== 'string') {
        throw new Error('urlBackend must be string');
    }
    app.set('state namespace', (namespace || 'CC'));
    var proxyApi = httpProxy.createProxyServer({
        target: urlBackend.replace(/\/$/, '') + '/api'
    });
    var urlParsed = url.parse(urlBackend);
    // 代理到 api 服务器
    app.use('/api', function (req, res, next) {
        if (req.headers.host) {
            req.headers.host = urlParsed.host;
        }
        proxyApi.web(req, res, {}, next);
    });
};
