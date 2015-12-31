'use strict';
export default {
    dsAppRoot: path.resolve(__dirname, '..'), // required
    dsComponentPrefix: 'dsc', // defaults to be 'dsc'
    dsComponentFallbackPrefix: ['node_modules/dsc-'], // defaults to be []
    dsExpressStateNameSpace: 'DS', // defaults to be 'DS'
    dsRequestAllowCookie: ['dsat'], // defaults to be ['dsat'], could be array, true (all) and false (none)
    dsSupportIE8: false, // defaults to be false
    dsBackendUrlPrefix: 'http://127.0.0.1:4001/',
}
