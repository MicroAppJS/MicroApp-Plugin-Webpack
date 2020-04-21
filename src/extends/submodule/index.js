'use strict';

module.exports = function subModuleWebpack(api, opts) {

    api.assertVersion('>=0.3.26');

    // TODO 只有开启 --sub-module 时才处理
    if (!api.context.subModule) {
        return;
    }

    // 解析 subModule 参数，只查询自己模块的
    const selfConfig = api.selfConfig || {};
    const originalConfig = selfConfig.originalConfig || {};

    const subModule = originalConfig.subModule;
    if (!subModule) {
        return;
    }

    // 增加校验配置
    api.validateSchema(require('./configSchema'), originalConfig);

    const configParser = require('./configParser');
    const _configParser = configParser(selfConfig);

    // 直接在 config 上设置, 扩增 config 配置
    const config = api.config;
    config.subModule = config.subModule || {};

    Object.assign(config.subModule, subModule, {
        prefix: _configParser.prefix(),
        namespace: _configParser.namespace(),
        entry: _configParser.entry(),
        fileName: _configParser.fileName(),
        outputDir: _configParser.outputDir(),
    });

    // change config.pages
    const entryPoints = config.subModule.entry;
    config.pages = {
        ...Object.keys(entryPoints).reduce((obj, key) => {
            obj[key] = {
                entry: entryPoints[key],
            };
            return obj;
        }, {}),
    };

    // externals, 注入全局 window


    // 生成 manifest
    api.modifyWebpackChain(webpackChain => {
        const otherOptions = Object.keys(config.subModule).reduce((obj, key) => {
            if (![ 'prefix', 'namespace', 'entry', 'outputDir' ].includes(key)) {
                obj[key] = config.subModule[key];
            }
            return obj;
        }, {});

        const ManifestPlugin = require('webpack-manifest-plugin');
        webpackChain.plugin('assets-manifest')
            .use(ManifestPlugin, [{
                generate(seed, files, entrypoints) {
                    return files.reduce((manifest, descriptor) => {
                        const { name, path, isInitial, isChunk } = descriptor;
                        if (descriptor.name.toLowerCase().endsWith('.map')) {
                            manifest.map = { ...(manifest.map || {}), [name]: path };
                        } else if (isInitial) {
                            manifest.entry = { ...(manifest.entry || {}), [name]: path };
                        } else if (isChunk) {
                            manifest.assets = { ...(manifest.assets || {}), [name]: path };
                        } else {
                            manifest.static = { ...(manifest.static || {}), [name]: path };
                        }
                        return manifest;
                    }, seed);
                },
                ...otherOptions,
            }])
            .end();

        // change outputDir
        if (config.subModule && config.subModule.outputDir) {
            webpackChain
                .output
                .path(api.resolve(outputDir))
                .end();
        }

        return api.applyPluginHooks('modifySubModuleWebpackChain', webpackChain);
    });

    api.modifyWebpackConfig(webpackConfig => {
        const namespace = config.subModule.namespace;
        const prefix = config.subModule.prefix;

        // chunkFilename
        const chunkFilename = webpackConfig.output.chunkFilename;
        if (chunkFilename && chunkFilename.includes('[name]')) {
            webpackConfig.output.chunkFilename = chunkFilename.replace('[name]', `${prefix}_${namespace}-[name]`);
        } else {
            webpackConfig.output.chunkFilename = `js/${prefix}_${namespace}-[name].[contenthash:8].js`;
        }

        return api.applyPluginHooks('modifySubModuleWebpackConfig', webpackConfig);
    });
};

module.exports.registerMethod = require('./methods');

module.exports.configuration = {
    description: 'webpack 适配增强 config 配置信息',
};
