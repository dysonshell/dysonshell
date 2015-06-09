'use strict';
var httpProxy = require('http-proxy');

module.exports = function expose(app, urlBackend) {
    if (typeof urlBackend !== 'string') {
        throw new Error('urlBackend must be string');
    }
    app.set('state namespace', (namespace || 'CC'));
    var proxyApi = httpProxy.createProxyServer({
        target: urlBackend.replace(/\/$/, '') + '/api';
    });
    // 代理到 api 服务器
    app.use('/api', function (req, res, next) {
        proxyApi.web(req, res, {}, next);
    });
};
