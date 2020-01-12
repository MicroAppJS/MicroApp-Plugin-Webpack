'use strict';

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    const { _, tryRequire, fs, semver } = require('@micro-app/shared-utils');

    api.modifyChainWebpackConfig(webpackChain => {
        const webpackPkgInfo = tryRequire('webpack/package.json');
        const webpackVersion = webpackPkgInfo && webpackPkgInfo.version || '3'; // 默认 3

        // webpack 4
        const isWebpack4 = semver.satisfies(webpackVersion, '>=4');

        const options = api.config || {};

        const alias = options.resolveAlias || {};
        const nodeModulesPaths = options.nodeModulesPaths || [];

        const entry = options.entry || {};

        Object.keys(entry).forEach(key => {
            webpackChain.entry(key).merge(entry[key]);
        });

        const mode = api.mode;

        if (isWebpack4) {
            webpackChain
                .mode(mode);
        }

        // reset, 兼容
        options.outputDir = webpackChain.output.get('path') || options.outputDir;
        options.publicPath = webpackChain.output.get('publicPath') || options.publicPath;

        const getAssetPath = require('./utils/getAssetPath');
        const outputFilename = getAssetPath(options, 'js/[name].js');

        webpackChain
            .context(api.root)
            .output
            .path(api.resolve(options.outputDir))
            .filename(outputFilename)
            .chunkFilename(outputFilename)
            .publicPath(options.publicPath)
            .end();

        webpackChain.resolve
            .extensions
            .merge([ '.mjs', '.js', '.jsx', '.vue', '.json', '.wasm' ])
            .end()
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
            .end()
            .alias
            .merge(alias)
            .end();

        webpackChain.resolveLoader
            .modules
            .add('node_modules')
            .add(api.resolve('node_modules'))
            .merge(nodeModulesPaths)
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
};

function getAssetPath(options, filePath) {
    return options.assetsDir
        ? path.posix.join(options.assetsDir, filePath)
        : filePath;
}

module.exports.configuration = {
    description: 'webpack 配置与基础配置参数统一',
};
