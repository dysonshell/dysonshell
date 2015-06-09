'use strict';

module.exports = function expose(app, urlBackend) {
    require('express-req-uest').augmentReqProto(app.request, {
        prefix: urlBackend,
        augments: {
            cookies: false,
            custom: function (r, req) {
                if (req.cookies.ccat) {
                    r.set('Authorization', 'Bearer ' + req.cookies.ccat);
                }
            }
        }
    });
};
