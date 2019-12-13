'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { tryRequire, fs } = require('@micro-app/shared-utils');

    api.modifyChainWebpcakConfig(webpackChain => {

        const options = api.config || {};

        const getAssetPath = require('./utils/getAssetPath');
        const outputFilename = getAssetPath(options, `js/[name].[contenthash:8].js`);

        webpackChain
            .context(api.root)
            .output
                .filename(outputFilename)
                .chunkFilename(outputFilename)
                .end();

        const multiPageConfig = options.pages;
        const pages = Object.keys(multiPageConfig);

        const publicCopyIgnore = ['.DS_Store'];
        pages.forEach(name => {
            const item = multiPageConfig[name];
            // load html
            const pageHtmlOptions = item.htmls;
            publicCopyIgnore.push(...pageHtmlOptions.map(opts => opts.template));
        });

        const NamedChunksPlugin = tryRequire('webpack/lib/NamedChunksPlugin');
        if (NamedChunksPlugin) {
            // keep chunk ids stable so async chunks have consistent hash (#1916)
            webpackChain
                .plugin('named-chunks')
                .use(NamedChunksPlugin, [chunk => {
                    if (chunk.name) {
                        return chunk.name
                    }

                    const hash = require('hash-sum');
                    const joinedHash = hash(
                        Array.from(chunk.modulesIterable, m => m.id).join('_')
                    );
                    return `chunk-` + joinedHash
                }]);
        }

        // copy static
        const COPYPlugin = tryRequire('copy-webpack-plugin');
        if (COPYPlugin) {
            const staticPaths = (options.staticPaths || []).filter(item => fs.existsSync(item));
            if (staticPaths.length) {
                webpackChain
                    .plugin('copy')
                    .use(COPYPlugin, [staticPaths.map(publicDir => {
                        return {
                            from: publicDir,
                            to: options.outputDir,
                            toType: 'dir',
                            ignore: publicCopyIgnore
                        };
                    })]);
            }
        }

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config for production',
    mode: 'production',
};
