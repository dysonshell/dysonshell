'use strict';
module.exports = function (hook) {
    hook.get('/b', function () {
        return {
            next: true,
            view: false,
            locals: {
                b: 2
            }
        }
    });
};
