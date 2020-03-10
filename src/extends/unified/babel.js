'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const path = require('path');

    api.modifyChainWebpackConfig(webpackChain => {
        // const isProd = api.mode === 'production';
        // const rootOptions = api.config || {};

        webpackChain.module
            .rule('js')
            .test(/\.m?jsx?$/)
            .exclude.add((/node_modules/)).end()
            .use('babel-loader')
            .loader(require.resolve('babel-loader'));


        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config - babel',
};

