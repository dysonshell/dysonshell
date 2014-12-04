'use strict';
var path = require('path');
var express = require('express');
var ecstatic = require('ecstatic');
var app, exports;
app = exports = module.exports = express();

var projectRoot = path.resolve(__dirname, '..');
var modulesSubfixReg = /\/node_modules$/i;
if (projectRoot.match(modulesSubfixReg)) {
    projectRoot = projectRoot.replace(/\/node_modules$/i, '');
}

app.use('/assets', ecstatic(path.join(projectRoot, 'assets')));
var viewsRoot = path.join(projectRoot, 'views');
app.set('views', viewsRoot);
app.set('view engine', 'html');

var render = require('./render');
app.engine('html', render.engine(viewsRoot));
app.use(render.middleware(viewsRoot));

if (require.main === module) {
    require('http').createServer(app).listen(process.env.PORT || 4000);
}