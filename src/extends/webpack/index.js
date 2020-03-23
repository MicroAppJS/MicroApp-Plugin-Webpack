'use strict';

module.exports = function extendWebpack(api, opts) {

    api.assertVersion('>=0.3.14');

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _, smartMerge } = require('@micro-app/shared-utils');

    // 直接在 microsConfig 上设置, 扩增 microsConfig 配置
    const configParser = require('./configParser');
    const configCombine = require('./configCombine');
    const microsExtraConfig = api.microsExtraConfig;
    const microsConfig = api.microsConfig;
    Object.keys(microsConfig).forEach(key => {
        const item = microsConfig[key];
        const _configParser = configParser(microsConfig, key, microsExtraConfig[key]);
        Object.assign(item, {
            entry: _configParser.entry(),
            htmls: _configParser.htmls(),
            staticPaths: _configParser.staticPaths(),
        });
        const _configCombine = configCombine(item);
        Object.assign(item, {
            pages: _configCombine.pages(),
            nodeModulesPaths: _configCombine.nodeModulesPaths(),
        });
    });

    // 直接在 config 上设置, 扩增 config 配置
    const config = api.config;

    // 只使用所有配置中的一个
    const originalConfig = smartMerge({}, ...Object.values(microsConfig).map(item => {
        const originalConfig = item.originalConfig || {};
        return _.pick(originalConfig, [
            'outputDir',
            'publicPath',
            'assetsDir',
            'devServer',
            'css',
        ]);
    }));

    // 增加校验配置
    api.validateSchema(require('./configSchema'), originalConfig);

    const defaultConfig = { // default config
        outputDir: 'dist',
        publicPath: '/',
        assetsDir: '',
        devServer: {},
        css: {},
    };
    smartMerge(config, ...Object.values(microsConfig).map(item => {
        return _.pick(item || {}, [
            'entry',
            'htmls',
            'staticPaths',
            'pages',
            'nodeModulesPaths',
        ]);
    }), defaultConfig, originalConfig);

};

module.exports.configuration = {
    description: 'webpack 适配增强 config 配置信息',
};
