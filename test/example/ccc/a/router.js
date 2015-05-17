'use strict';
module.exports = function (router) {
    router.get('/aa', function (req, res, next) {
        res.end('hello');
    });
};
