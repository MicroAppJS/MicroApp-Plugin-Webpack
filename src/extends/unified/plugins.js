'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    api.modifyWebpackChain(webpackChain => {
        const { resolveLoaderError } = require('./utils');

        // const options = api.config || {};

        webpackChain
            .plugin('case-sensitive-paths')
            .use(require('case-sensitive-paths-webpack-plugin'));


        // friendly error plugin displays very confusing errors when webpack
        // fails to resolve a loader, so we provide custom handlers to improve it
        const { transformer, formatter } = resolveLoaderError;
        webpackChain
            .plugin('friendly-errors')
            .use(require('@soda/friendly-errors-webpack-plugin'), [{
                additionalTransformers: [ transformer ],
                additionalFormatters: [ formatter ],
            }]);

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config - plugins',
};
