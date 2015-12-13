'use strict';
var path = require('path');

module.exports = function prodrev(app) {
    app.response.send = (function (send) {
        var rewriter = require('ds-rewriter');
        var revMap = app.get('env') === 'production' ? require(path.join((GLOBAL.APP_ROOT || './'), 'dist/rev.json')) : {};
        return function () {
            var res = this;
            var args = Array.prototype.slice.call(arguments);
            if (typeof args[0] === 'string') {
                args[0] = rewriter(revMap, args[0], res.locals.noMediaQueries);
            }
            return send.apply(res, args);
        };
    }(app.response.send));
};
