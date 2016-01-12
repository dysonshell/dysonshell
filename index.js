'use strict';

exports.cache = require('./cache');
exports.loader = require('./loader');
exports.expose = require('./expose');
exports.apiproxy = require('./apiproxy');
exports.request = require('./request');
Object.defineProperty(exports, 'build', {
    get: function () {
         return require('ds-pack/build');
    },
});
exports.watchify = require('ds-pack/augment-app');
