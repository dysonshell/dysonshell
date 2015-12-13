'use strict';
var config = require('config');
var expState = require('express-state');

module.exports = function expose(app, namespace) {
    expState.extend(app);
    if (!app.set('state namespace')) {
        app.set('state namespace', (namespace || config.dsExpressStateNameSpace || 'DS'));
    }
    app.use(function (req, res, next) {
        res.expose(process.env.NODE_ENV, 'process.env.NODE_ENV');
        res.expose(process.env.NODE_APP_INSTANCE, 'process.env.NODE_APP_INSTANCE');
        next();
    });
};
