'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { tryRequire, fs, hash } = require('@micro-app/shared-utils');

    api.modifyChainWebpackConfig(webpackChain => {
        const { isWebpack4 } = require('./utils');

        const options = api.config || {};

        webpackChain
            .context(api.root)
            .end();

        if (isWebpack4()) {
            const getAssetPath = require('./utils/getAssetPath');
            const outputFilename = getAssetPath(options, 'js/[name].[contenthash:8].js');
            webpackChain
                .output
                .filename(outputFilename)
                .chunkFilename(outputFilename)
                .end();
        }

        const multiPageConfig = options.pages;
        const pages = Object.keys(multiPageConfig);

        const publicCopyIgnore = [ '.DS_Store' ];
        pages.forEach(name => {
            const item = multiPageConfig[name];
            // load html
            const pageHtmlOptions = item.html;
            if (pageHtmlOptions.template) {
                publicCopyIgnore.push(pageHtmlOptions.template);
            }
        });

        const NamedChunksPlugin = tryRequire('webpack/lib/NamedChunksPlugin');
        if (NamedChunksPlugin) {
            // keep chunk ids stable so async chunks have consistent hash (#1916)
            webpackChain
                .plugin('named-chunks')
                .use(NamedChunksPlugin, [ chunk => {
                    if (chunk.name) {
                        return chunk.name;
                    }

                    const joinedHash = hash(
                        Array.from(chunk.modulesIterable, m => m.id).join('_')
                    );
                    return 'chunk-' + joinedHash;
                } ]);
        }

        // copy static
        const staticPaths = (options.staticPaths || []).filter(item => fs.existsSync(item));
        if (staticPaths.length) {
            const COPYPlugin = tryRequire('copy-webpack-plugin');
            if (COPYPlugin) {
                webpackChain
                    .plugin('copy')
                    .use(COPYPlugin, [ staticPaths.map(publicDir => {
                        return {
                            from: publicDir,
                            // to: options.outputDir,
                            toType: 'dir',
                            ignore: publicCopyIgnore,
                        };
                    }) ]);
            } else {
                api.logger.warn('[webpack]', 'Not Found "copy-webpack-plugin"');
            }
        }


        const TerserPlugin = require('terser-webpack-plugin');
        webpackChain.optimization
            .minimizer('terser')
            .use(TerserPlugin, [ require('./utils/terserOptions') ]);


        // keep module.id stable when vendor modules does not change
        webpackChain
            .plugin('hash-module-ids')
            .use(require('webpack/lib/HashedModuleIdsPlugin'), [{
                hashDigest: 'hex',
            }]);

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config for production',
    mode: 'production',
};
