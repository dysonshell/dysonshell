#!/usr/bin/env node
'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var cpr = require('cpr');
var rimraf = require('rimraf');
var version = require('./package.json').version.match(/^\d+/);

var cwd = process.cwd();
function exists(filePath) {
    var args = [].slice.call(arguments);
    return new Promise(function (resolve) {
        fs.exists(path.join.apply(path, args), resolve);
    });
}

var writeFile = Promise.promisify(fs.writeFile.bind(fs));
function stringWriteToFile(str) {
    var args = [].slice.call(arguments, 1);
    return writeFile(path.join.apply(path, args), str, 'utf-8');
}
var readFile = Promise.promisify(fs.readFile.bind(fs));
function readFileFrom() {
    var args = [].slice.call(arguments);
    return readFile(path.join.apply(path, args), 'utf-8');
}

function cexists(module) {
    return exists.apply(null, [cwd].concat([].slice.call(arguments)));
}

function mexists(module) {
    return cexists.apply(null, ['node_modules'].concat([].slice.call(arguments)));
}

var deps = {
    "bluebird": "^3",
    "config": "^1",
    "dysonshell": "^1",
    "express": "^4",
    "lodash": "^3",
    "moment": "^2",
    "promisingagent": "^4",
    "qs": "^6",
    "ractive": "^0.7.3"
};

var supportIE8 = process.argv.indexOf('ie8') > -1;

Promise.coroutine(function* () {
    if (!(yield cexists('package.json'))) {
        yield stringWriteToFile('{}', cwd, 'package.json');
    }
    var pkg = JSON.parse(yield readFileFrom(cwd, 'package.json'));
    pkg.dependencies = pkg.dependencies || {};
    if (supportIE8) {
        pkg.dependencies['lodash-compat'] = '^3';
    _.assign(pkg.dependencies, deps);
    yield stringWriteToFile(JSON.stringify(pkg, null, '  '), cwd, 'package.json');

    var exfolder = supportIE8 ? 'ie8init' : 'init';
    cpr(path.join(__dirname, 'examples', exfolder), cwd, function (err, files) {
        if (err) {
            console.log(err);
        }
        console.log('copied files:\n', files.join('\n'), '\n');
    });

})();
