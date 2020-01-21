'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { tryRequire } = require('@micro-app/shared-utils');

    api.modifyChainWebpackConfig(webpackChain => {
        webpackChain = baseConfig(webpackChain);

        const options = api.config || {};

        const entry = options.entry || {};
        // entry
        Object.keys(entry).forEach(key => {
            webpackChain.entry(key).merge(entry[key]);
        });

        // reset, 兼容
        options.outputDir = webpackChain.output.get('path') || options.outputDir || 'dist';
        options.publicPath = webpackChain.output.get('publicPath') || options.publicPath || '/';

        const getAssetPath = require('./utils/getAssetPath');
        const outputFilename = getAssetPath(options, 'js/[name].js');

        // output
        webpackChain
            .context(api.root)
            .output
            .path(api.resolve(options.outputDir))
            .filename(outputFilename)
            .chunkFilename(outputFilename)
            .publicPath(options.publicPath)
            .end();

        const alias = options.resolveAlias || {};
        // alias
        webpackChain.resolve
            .extensions
            .merge([ '.mjs', '.js', '.jsx', '.vue', '.json', '.wasm' ])
            .end()
            .alias
            .merge(alias)
            .end();

        const multiPageConfig = options.pages;
        const pages = Object.keys(multiPageConfig);
        const HTMLPlugin = tryRequire('html-webpack-plugin');

        const publicCopyIgnore = [ '.DS_Store' ];
        pages.forEach(name => {
            const item = multiPageConfig[name];
            // load html
            const pageHtmlOptions = item.htmls;
            if (HTMLPlugin) {
                pageHtmlOptions.forEach((htmlOpts, index) => {
                    const pname = index ? `html-${name}-${index}` : `html-${name}`;

                    // if (isProd) { // 暂时不定义，外部自行配置
                    //     Object.assign(htmlOpts, {
                    //         minify: {
                    //             removeComments: true,
                    //             collapseWhitespace: true,
                    //             removeAttributeQuotes: true,
                    //             collapseBooleanAttributes: true,
                    //             removeScriptTypeAttributes: true
                    //             // more options:
                    //             // https://github.com/kangax/html-minifier#options-quick-reference
                    //         }
                    //     });
                    // }
                    webpackChain
                        .plugin(pname)
                        .use(HTMLPlugin, [ htmlOpts ]);
                });
            }
            publicCopyIgnore.push(...pageHtmlOptions.map(opts => opts.template));
        });

        return webpackChain;
    });

    api.modifyChainWebpackPluginConfig(webpackChain => {
        // TODO 补充基本配置
        webpackChain = baseConfig(webpackChain);

        webpackChain.target('node');
        webpackChain.node.set('__dirname', false);
        webpackChain.node.set('__filename', false);

        const options = api.serverConfig || {};

        const outputFilename = 'plugin/[name].js';

        // output
        options.outputDir = options.outputDir || 'dist';
        options.publicPath = options.publicPath || '/';

        webpackChain
            .context(api.root)
            .output
            .path(api.resolve(options.outputDir))
            .filename(outputFilename)
            .chunkFilename(outputFilename)
            .publicPath(options.publicPath)
            .libraryTarget('umd')
            .end();


        const alias = options.resolveShared || {};
        // alias
        webpackChain.resolve
            .extensions
            .merge([ '.mjs', '.js', '.json', '.wasm', '.node' ])
            .end()
            .alias
            .merge(alias)
            .end();

        // 去除内置的工具库
        webpackChain
            .externals([
                '@micro-app/core',
                '@micro-app/cli',
                '@micro-app/shared-utils',
            ]);


        return webpackChain;
    });

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
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
            .end();

        webpackChain.resolveLoader
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
            .end();

        return webpackChain;
    }
};

module.exports.configuration = {
    description: 'webpack 配置与基础配置参数统一',
};

function webpackVersion() {
    const { tryRequire } = require('@micro-app/shared-utils');
    const webpackPkgInfo = tryRequire('webpack/package.json');
    const _webpackVersion = webpackPkgInfo && webpackPkgInfo.version || '3'; // 默认 3
    return _webpackVersion;
}

function isWebpack4() {
    const { semver } = require('@micro-app/shared-utils');
    const _webpackVersion = webpackVersion();
    // webpack 4
    const _isWebpack4 = semver.satisfies(_webpackVersion, '>=4');
    return _isWebpack4;
}
