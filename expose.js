'use strict';
var expState = require('express-state');

module.exports = function expose(app, namespace) {
    expState.extend(app);
    app.set('state namespace', (namespace || 'CC'));
};
