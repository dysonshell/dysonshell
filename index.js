'use strict';

var path = require('path');
var express = require('express');
var ecstatic = require('ecstatic');
var app, exports;
app = exports = module.exports = express();
app.use('/assets', ecstatic(path.join(__dirname, '..', 'assets')));

var viewsRoot = path.join(__dirname, '..', 'views');
app.set('views', viewsRoot);
app.set('view engine', 'html');

var render = require('./render');
app.engine('html', render.engine(viewsRoot));
app.use(render);

if (require.main === module) {
    require('http').createServer(app).listen(process.env.PORT || 4000);
}