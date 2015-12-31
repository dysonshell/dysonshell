'use strict';

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var cpr = require('cpr');
var rimraf = require('rimraf');

function exists(filePath) {
    return new Promise(function (resolve) {
        fs.exists(path.resolve.apply(path, [__dirname].concat([].slice.call(arguments))), resolve);
    });
}

function mexists(module) {
    return exists.apply(null, ['..'].concat([].slice.call(arguments)));
}

function rdexists(relativeDirectoryPath) {
    return exists.apply(null, [__dirname, '..', '..'].concat([].slice.call(arguments)));
}

Promise.coroutine(function* () {
    var child;
    if (!(yield mexists('config')) || !(yield mexists('express'))) {
        child = spawn(process.env.npm_node_execpath, [
                process.env.npm_execpath,
                'install', '--save',
                'config@^1', 'express@^4'
        ], {
            cwd: path.resolve(__dirname, '..', '..'),
            stdio: 'inherit',
        });
        yield new Promise(function (resolve, reject) {
            child.on('end', resolve);
            child.on('error', reject);
        });
    }

    if ((yield exists('node_modules', 'express'))) {
        rimraf(path.join(__dirname, 'node_modules', 'express'));
    }

    if ((yield exists('node_modules', 'config'))) {
        rimraf(path.join(__dirname, 'node_modules', 'config'));
    }

    if ((yield rdexists('config')) || (yield rdexists('dsc'))) {
        return;
    }

    child = spawn(process.env.npm_node_execpath, [
            process.env.npm_execpath,
            'install', '--save',
            'bluebird', 'lodash', 'ractive', 'qs', 'moment', 'promisingagent',
    ], {
        cwd: path.resolve(__dirname, '..', '..'),
        stdio: 'inherit',
    });
    yield new Promise(function (resolve, reject) {
        child.on('end', resolve);
        child.on('error', reject);
    });

    cpr(path.join(__dirname, 'examples', 'init'), path.resolve(__dirname, '..', '..'), function (err, files) {
        if (err) {
            console.log(err);
        }
        console.log('copied files:\n', files.join('\n'));
    });

})();
