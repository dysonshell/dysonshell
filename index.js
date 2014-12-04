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

/* render middleware 应该是最后一个 middleware
 * 所以不直接在这里 app.use() 而是给开发者 appendRender 方法
 * 在 listen 之前调用 */
app.appendRender = app.use.bind(app, render.middleware(viewsRoot));

if (require.main === module) {
    app.appendRender();
    require('http').createServer(app).listen(process.env.PORT || 4000);
}