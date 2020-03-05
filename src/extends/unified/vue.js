'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    api.modifyChainWebpackConfig(webpackChain => {
        // const isProd = api.mode === 'production';
        // const rootOptions = api.config || {};

        webpackChain.resolve
            .extensions
            .merge([ '.vue' ])
            .end();

        webpackChain.module
            .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/);

        // vue-loader --------------------------------------------------------------
        const vueLoaderCacheIdentifier = {
            'vue-loader': require('vue-loader/package.json').version,
        };

        // The following 2 deps are sure to exist in Vue 2 projects.
        // But once we switch to Vue 3, they're no longer mandatory.
        // (In Vue 3 they are replaced by @vue/compiler-sfc)
        // So wrap them in a try catch block.
        try {
            vueLoaderCacheIdentifier['vue-template-compiler'] =
          require('vue-template-compiler/package.json').version;
        } catch (e) {
            // nothing
        }
        const vueLoaderCacheConfig = {
            cacheIdentifier: JSON.stringify(vueLoaderCacheIdentifier),
        };

        webpackChain.module
            .rule('vue')
            .test(/\.vue$/)
            .use('cache-loader')
            .loader(require.resolve('cache-loader'))
            .options(vueLoaderCacheConfig)
            .end()
            .use('vue-loader')
            .loader(require.resolve('vue-loader'))
            .options(Object.assign({
                compilerOptions: {
                    whitespace: 'condense',
                },
            }, vueLoaderCacheConfig));

        webpackChain
            .plugin('vue-loader')
            .use(require('vue-loader/lib/plugin'));

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config - vue',
};

