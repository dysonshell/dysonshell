'use strict';
module.exports = function (hook) {
    hook.get('/b', function () {
        return {
            view: false,
            locals: {
                b: 2
            }
        }
    });
};
