'use strict';

var fs = require('fs');
var path = require('path');
var less = require('less');


exports.lessMiddleware = function(cssRoot) {
    return function(req, res, next) {
        if (!req.url.match(/\.css($|\?)/i)) {
            return next();
        }
        var filePath = path.join(cssRoot, req.path.replace(/\.css$/i, '.less'));
        fs.readFile(filePath, {
            encoding: 'utf-8'
        }, function(err, content) {
            if (err) {
                return next(err.code === 'ENOENT' ? null : err);
            }
            res.type('css');

            less.render(content, {
                filename: filePath,
                relativeUrls: true,
                paths: [path.dirname(filePath)],
                sourceMap: { sourceMapFileInline: true}  //TODO: source maps 文件路径没有确认，可能需要调整
            }, function(err, output) {
                if (err) {
                    console.dir(err);
                    res.status(500);
                    res.type('txt');
                    res.end('/*\n' + JSON.stringify(err, null, '  ') + '\n*/');
                } else {
                    res.send(output.css);
                }
            });
        });
    };
};

var browserify = require('browserify');
exports.jsMiddleware = function(browserifyRoot) {
    return function(req, res, next) {
        if (!req.url.match(/\.js($|\?)/i)) {
            return next();
        }
        var filePath = path.join(browserifyRoot, req.path);
        res.type('js');
        fs.exists(filePath, function(exists) {
            if (!exists) {
                return next();
            }
            try {
                var b = browserify({
                    entries: [filePath],
                    debug: true  //TODO: source maps 的文件路径不对
                });
                b.on('error', function(e) {
                    console.log(e.stack);
                });
                b.bundle().pipe(res);
            } catch (e) {
                console.log(e.stack);
                res.status(500);
                var errMsg = e.toString();
                res.end('/*\n' + errMsg + '\n*\/');
            }
        });
    };
};

exports.getJsLib = function(libJsonPath) {
    return function(req, res, next) {
        var content;
        try {
            content = JSON.parse(fs.readFileSync(libJsonPath), 'utf-8')
            .filter(function (filename) {
                return filename[0] === '.' && filename.match(/\.js$/i);
            })
            .map(function (filename) {
                return path.resolve(path.dirname(libJsonPath), filename);
            })
            .map(function (filepath) {
                return fs.readFileSync(filepath, 'utf-8');
            })
            .join(';\n\n');
        } catch (err) {
            return next(err);
        }
        res.type('js');
        res.send(content);
    };
};