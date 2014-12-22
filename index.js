'use strict';
var express = require('express');
var app, exports;
app = exports = module.exports = express();

require('express-state').extend(app);
app.set('state namespace', 'MY_APP');
