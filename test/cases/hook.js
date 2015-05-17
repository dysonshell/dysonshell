'use strict';
var http = require('http');
var tape = require('tape');
var app = require('../example');
var server = http.createServer(app);
var address = server.listen().address();
console.log(address);

/*
tape(function (test) {
    test.plan(1);
    test.ok(1);
});
*/
