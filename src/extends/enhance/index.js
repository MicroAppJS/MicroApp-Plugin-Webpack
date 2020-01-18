'use strict';

module.exports = function WebpackAdapter(api, opts) {

    api.assertVersion('>=0.2.0');

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _ } = require('@micro-app/shared-utils');
    const Config = require('webpack-chain');

    let initialized = false;

    const logger = api.logger;

    api.extendMethod('resolveChainableWebpackConfig', {
        description: 'resolve webpack-chain config.',
    }, ({ target = 'app' } = {}) => {
        if (!initialized) {
            logger.throw('please call after "onInitWillDone" !');
        }

        const webpackChainConfig = new Config();
        let finalWebpackChainConfig = webpackChainConfig;
        if (target === 'plugin') {
            // TODO 针对所有 plugin 的配置进行处理
            finalWebpackChainConfig = api.applyPluginHooks('modifyChainWebpackPluginConfig', webpackChainConfig);
            api.applyPluginHooks('onChainWebpcakPluginConfig', finalWebpackChainConfig);
        } else {
            const selfConfig = api.selfConfig || {};
            const originalConfig = selfConfig.originalConfig || {};
            const _originalWebpackConfig = _.cloneDeep(originalConfig.webpack || {});
            delete _originalWebpackConfig.entry; // 不接受 entry, 内部已经做了兼容
            delete _originalWebpackConfig.plugins; // 不接受 plugins
            webpackChainConfig.merge(_originalWebpackConfig);

            finalWebpackChainConfig = api.applyPluginHooks('modifyChainWebpackConfig', webpackChainConfig);
            api.applyPluginHooks('onChainWebpcakConfig', finalWebpackChainConfig);
        }

        api.setState('webpackChainConfig', finalWebpackChainConfig);
        return finalWebpackChainConfig;
    });

    api.extendMethod('resolveWebpackConfig', {
        description: 'resolve webpack config.',
    }, ({ target = 'app' } = {}) => {
        const finalWebpackChainConfig = api.resolveChainableWebpackConfig({ target });
        const webpackConfig = finalWebpackChainConfig.toConfig();
        if (target === 'plugin') {
            api.applyPluginHooks('modifyWebpackPluginConfig', webpackConfig);
        } else {
            api.applyPluginHooks('modifyWebpackConfig', webpackConfig);
        }

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
