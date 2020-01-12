'use strict';

module.exports = function WebpackAdapter(api, opts) {

    api.assertVersion('>=0.2.0');

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _ } = require('@micro-app/shared-utils');
    const Config = require('webpack-chain');

    let initialized = false;

    api.extendMethod('resolveChainableWebpackConfig', {
        description: 'resolve webpack-chain config.',
    }, () => {
        if (!initialized) {
            api.logger.error('please call after "onInitWillDone" !');
            process.exit(1);
        }
        const selfConfig = api.selfConfig || {};
        const originalConfig = selfConfig.originalConfig || {};
        const _originalWebpackConfig = _.cloneDeep(originalConfig.webpack || {});
        delete _originalWebpackConfig.entry; // 不接受 entry, 内部已经做了兼容
        delete _originalWebpackConfig.plugins; // 不接受 plugins

        const webpackChainConfig = new Config();
        webpackChainConfig.merge(_originalWebpackConfig);

        const finalWebpackChainConfig = api.applyPluginHooks('modifyChainWebpackConfig', webpackChainConfig);
        api.applyPluginHooks('onChainWebpcakConfig', finalWebpackChainConfig);

        api.setState('webpackChainConfig', finalWebpackChainConfig);
        return finalWebpackChainConfig;
    });

    api.extendMethod('resolveWebpackConfig', {
        description: 'resolve webpack config.',
    }, () => {
        const finalWebpackChainConfig = api.resolveChainableWebpackConfig();
        const webpackConfig = api.applyPluginHooks('modifyWebpackConfig', finalWebpackChainConfig.toConfig());

        api.setState('webpackConfig', webpackConfig);
        return webpackConfig;
    });

    api.onInitWillDone(() => {
        initialized = true;
    });
};

module.exports.configuration = {
    description: 'webpack 适配器, 对外提供多个触发事件',
};
