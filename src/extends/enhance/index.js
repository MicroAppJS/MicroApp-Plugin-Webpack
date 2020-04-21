'use strict';

module.exports = function WebpackAdapter(api, opts) {

    api.assertVersion('>=0.3.29');

    const { _ } = require('@micro-app/shared-utils');
    const Config = require('webpack-chain');

    let initialized = false;

    const logger = api.logger;

    api.extendMethod('resolveWebpackChain', {
        description: 'resolve webpack-chain config.',
    }, (webpackChainConfig = new Config()) => {
        if (!initialized) {
            logger.throw('please call after "onInitWillDone" !');
        }

        // 可通过外部初始化一个已存在的 webpackChain 实例
        webpackChainConfig = api.applyPluginHooks('createWebpackChainInstance', webpackChainConfig);

        const selfConfig = api.selfConfig || {};
        const originalConfig = selfConfig.originalConfig || {};
        const _originalWebpackConfig = _.cloneDeep(originalConfig.webpack || {});
        delete _originalWebpackConfig.entry; // 不接受 entry, 内部已经做了兼容
        delete _originalWebpackConfig.plugins; // 不接受 plugins
        webpackChainConfig.merge(_originalWebpackConfig);

        const target = api.target; // target, 默认 web
        if ([ 'app', 'lib', 'web' ].includes(target)) { // 其它类型外部自己设置
            webpackChainConfig.target('web');
        }

        const finalWebpackChainConfig = api.applyPluginHooks('modifyWebpackChain', webpackChainConfig);
        api.applyPluginHooks('onWebpcakChain', finalWebpackChainConfig);

        api.setState('webpackChainConfig', finalWebpackChainConfig);
        return finalWebpackChainConfig;
    });

    api.extendMethod('resolveWebpackConfig', {
        description: 'resolve webpack config.',
    }, webpackChainConfig => {
        const finalWebpackChainConfig = api.resolveWebpackChain(webpackChainConfig);
        const webpackConfig = finalWebpackChainConfig.toConfig();
        const finalWebpackConfig = api.applyPluginHooks('modifyWebpackConfig', webpackConfig);
        api.applyPluginHooks('onWebpcakConfig', finalWebpackConfig);

        api.setState('webpackConfig', finalWebpackConfig);
        return finalWebpackConfig;
    });

    api.onInitWillDone(() => {
        initialized = true;
    });
};

module.exports.registerMethod = require('./methods');

module.exports.configuration = {
    description: 'webpack 适配器, 对外提供多个触发事件',
};
