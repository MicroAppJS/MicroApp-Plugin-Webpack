'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { tryRequire } = require('@micro-app/shared-utils');

    api.modifyChainWebpackConfig(webpackChain => {
        const { getAssetPath } = require('./utils');

        const options = api.config || {};

        const inlineLimit = 4096;

        const genAssetSubPath = dir => {
            return getAssetPath(
                options,
                `${dir}/[name]${options.filenameHashing ? '.[hash:8]' : ''}.[ext]`
            );
        };

        // static assets -----------------------------------------------------------
        // 1. file-loader
        // 2. url-loader

        const genUrlLoaderOptions = dir => {
            return {
                limit: inlineLimit,
                // use explicit fallback to avoid regression in url-loader>=1.1.0
                fallback: {
                    loader: require.resolve('file-loader'),
                    options: {
                        name: genAssetSubPath(dir),
                    },
                },
            };
        };

        webpackChain.module
            .rule('images')
            .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
            .use('url-loader')
            .loader(require.resolve('url-loader'))
            .options(genUrlLoaderOptions('images'));


        // do not base64-inline SVGs.
        // https://github.com/facebookincubator/create-react-app/pull/1180
        webpackChain.module
            .rule('svg')
            .test(/\.(svg)(\?.*)?$/)
            .use('file-loader')
            .loader(require.resolve('file-loader'))
            .options({
                name: genAssetSubPath('img'),
            });

        webpackChain.module
            .rule('media')
            .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
            .use('url-loader')
            .loader(require.resolve('url-loader'))
            .options(genUrlLoaderOptions('media'));

        webpackChain.module
            .rule('fonts')
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
            .use('url-loader')
            .loader(require.resolve('url-loader'))
            .options(genUrlLoaderOptions('fonts'));

        // .node
        webpackChain.module
            .rule('node')
            .test(/\.(node)(\?.*)?$/)
            .parser({
                amd: false,
            })
            .exclude.add((/node_modules/)).end()
            .use('node-loader')
            .loader(require.resolve('node-loader'))
            .options({});

        webpackChain.module
            .rule('node')
            .test(/\.(m?js|node)(\?.*)?$/)
            .exclude.add((/node_modules/)).end()
            .use('@marshallofsound/webpack-asset-relocator-loader')
            .loader(require.resolve('@marshallofsound/webpack-asset-relocator-loader'))
            .options({
                outputAssetBase: 'native_modules',
            });

        webpackChain.module
            .rule('ts')
            .test(/\.(tsx?)(\?.*)?$/)
            .exclude.add((/node_modules/)).end()
            .use('ts-loader')
            .loader(require.resolve('ts-loader'))
            .options({
                transpileOnly: true,
            });

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config - rules',
};
