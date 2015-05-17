'use strict';
module.exports = function (hook) {
    hook.get('/a', function () {
        return {
            view: false,
            locals: {
                a: 1
            }
        }
    });
    hook.get('/b', function () {
        return {
            next: true,
            view: false,
            locals: {
                a: 1
            }
        }
    });
};
