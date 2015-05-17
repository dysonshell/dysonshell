'use strict';
global.APP_ROOT = __dirname;
var app = module.exports = require('express')();
require('../../').loader(app);
