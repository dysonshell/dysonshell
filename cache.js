'use strict';
var _ = require('lodash');
module.exports = function(app) {
    app.response.send = (function (send) {
        return function (body) {
            var res = this;
            if (typeof res.dsHookSend === 'function') {
                res.dsHookSend(body);
                delete res.dsHookSend;
            }
            return send.apply(res, arguments);
        }
    }(app.response.send));
    if (app.get('env') === 'development') {
        return;
    }
    app.use(function *(req, res, next) {
        if (typeof res.dsCache !== 'function') {
            return next();
        }
        var cached = yield Promise.resolve(res.dsCache());
        if (!(cached.statusCode < 400)) {
            return next();
        }
        if (cached.headers) {
            _.each(cached.headers, (v, k) => res.set(k, v));
        }
        res.send(cached.body);
    });
};
