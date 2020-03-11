'use strict';

module.exports = function extendWebpack(api, opts) {

    api.assertVersion('>=0.3.0');

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _, smartMerge } = require('@micro-app/shared-utils');

    // 扩增 microsConfig 配置
    api.modifyMicrosConfig(_config => {
        const configParser = require('./configParser');
        const microsExtraConfig = api.microsExtraConfig;
        return Object.keys(_config).reduce((obj, key) => {
            const _configParser = configParser(obj, key, microsExtraConfig[key]);
            Object.assign(obj[key], {
                entry: _configParser.entry(),
                htmls: _configParser.htmls(),
                staticPaths: _configParser.staticPaths(),
            });
            return obj;
        }, _config);
    });

    // 扩增 config 配置
    api.modifyDefaultConfig(_config => {
        const configCombine = require('./configCombine');
        const microsConfig = api.microsConfig;
        const selfConfig = api.selfConfig;
        const _selfConfigCombine = configCombine(selfConfig);

        function pickOptions(obj) {
            return _.pick(obj, [
                'alias',
                'resolveAlias',
                'shared',
                'resolveShared',
                'entry',
                'htmls',
                'staticPaths',
            ]);
        }

        const micros = api.micros;
        const finalMicrosConfigs = micros.map(key => {
            const obj = microsConfig[key];
            if (!obj) return {};
            const _configCombine = configCombine(obj);
            return Object.assign({
                pages: _configCombine.pages(),
                nodeModulesPaths: _configCombine.nodeModulesPaths(),
            }, pickOptions(obj));
        });

        const finalConfig = smartMerge({}, ...finalMicrosConfigs, Object.assign({
            pages: _selfConfigCombine.pages(),
            nodeModulesPaths: _selfConfigCombine.nodeModulesPaths(),
        }, pickOptions(selfConfig), selfConfig));

        const originalConfig = selfConfig.originalConfig || {};
        const defaultConfig = {
            outputDir: 'dist',
            publicPath: '/',
            assetsDir: '',
            devServer: {},
            css: {},
        };
        const otherConfig = Object.assign({ // default config
            ...defaultConfig,
        }, _.pick(originalConfig, [
            'outputDir',
            'publicPath',
            'assetsDir',
            'devServer',
            'css',
        ]));
        // 校验
        return Object.assign({}, _config, _.cloneDeep(finalConfig), otherConfig);
    });
};

module.exports.configuration = {
    description: 'webpack 适配增强 config 配置信息',
};
