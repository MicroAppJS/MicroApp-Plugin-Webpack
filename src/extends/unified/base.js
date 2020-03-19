'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { getAssetPath, isWebpack4 } = require('./utils');

    // 通用基础配置
    function baseConfig(webpackChain) {
        const options = api.config || {};
        const nodeModulesPaths = options.nodeModulesPaths || [];
        const mode = api.mode;

        if (isWebpack4()) {
            webpackChain
                .mode(mode);
        }

        webpackChain.resolve
            .set('symlinks', true)
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
            .end();

        webpackChain.resolveLoader
            .set('symlinks', true)
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
            .end();

        return webpackChain;
    }

    api.modifyChainWebpackConfig(webpackChain => {

        webpackChain = baseConfig(webpackChain);

        const options = api.config || {};

        // reset, 兼容
        options.outputDir = webpackChain.output.get('path') || options.outputDir || 'dist';
        options.publicPath = webpackChain.output.get('publicPath') || options.publicPath || '/';

        const outputFilename = getAssetPath(options, 'js/[name].js');

        // output
        webpackChain
            .context(api.root)
            .output
            .path(api.resolve(options.outputDir))
            .filename(outputFilename)
            .publicPath(options.publicPath)
            .end();

        if (isWebpack4()) {
            webpackChain
                .output
                .chunkFilename(outputFilename)
                .end();
        }

        const alias = options.resolveAlias || {};
        // alias
        webpackChain.resolve
            .extensions
            .merge([ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm' ])
            .end()
            .alias
            .merge(alias)
            .end();

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack 通用基础配置',
};
