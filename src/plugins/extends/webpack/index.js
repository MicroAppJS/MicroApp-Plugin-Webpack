'use strict';

module.exports = function extendWebpack(api, opts) {

    api.assertVersion('>=0.2.0');

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _, smartMerge } = require('@micro-app/shared-utils');

    // 扩增 microsConfig 配置
    api.modifyMicrosConfig(_config => {
        const configParser = require('./configParser');
        return Object.keys(_config).reduce((obj, key) => {
            const _configParser = configParser(obj, key);
            const publicPaths = _configParser.publicPaths();
            Object.assign(obj[key], {
                entry: _configParser.entry(),
                htmls: _configParser.htmls(),
                dlls: _configParser.dlls(),
                publicPaths,
                staticPaths: publicPaths, // deprecated
            });
            return obj;
        }, _config);
    });

    // 扩增 config 配置
    api.modifyDefaultConfig(_config => {
        const configCombine = require('./configCombine');
        const microsConfig = api.microsConfig;
        const selfConfig = api.selfConfig;
        const _selfConfigCombine = configCombine(selfConfig, 'index');
        const micros = api.micros;
        const finalConfig = smartMerge({}, ...micros.map(key => {
            const obj = microsConfig[key];
            if (!_.isPlainObject(obj)) return {};
            const _configCombine = configCombine(obj, key);
            return Object.assign({
                pages: _configCombine.pages(),
            }, _.pick(obj, [
                'alias',
                'resolveAlias',
                'shared',
                'resolveShared',
                'entry',
                'htmls',
                'dlls',
                'publicPaths',
                'staticPaths',
            ]));
        }), Object.assign({
            pages: _selfConfigCombine.pages(),
        }), selfConfig);
        const originalConfig = selfConfig.originalConfig || {};
        const defaultConfig = {
            outputDir: 'dist',
            assetsDir: '',
            loaderOptions: {},
            devServer: {},
        };
        const otherConfig = Object.assign({ // default config
            ...defaultConfig,
        }, _.pick(originalConfig, [
            'outputDir',
            'assetsDir',
            'loaderOptions',
            'devServer',
        ]));
        // 校验
        return Object.assign({}, _config, _.cloneDeep(finalConfig), otherConfig);
    });
};

module.exports.configuration = {
    description: 'webpack 适配增强 config 配置信息',
};
