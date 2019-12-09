'use strict';

// TODO 可以优化为 webpack-chain

const merge = require('webpack-merge');

// 修补
function patchWebpack(microConfig) {
    if (!microConfig) {
        return {};
    }
    const webpackConfig = {};
    if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
    }
    if (!webpackConfig.resolve.modules || !Array.isArray(webpackConfig.resolve.modules)) {
        webpackConfig.resolve.modules = [];
    }
    if (microConfig.nodeModules && !webpackConfig.resolve.modules.includes(microConfig.nodeModules)) {
        webpackConfig.resolve.modules.push(microConfig.nodeModules);
    }

    if (!webpackConfig.entry) {
        webpackConfig.entry = {};
    }
    Object.assign(webpackConfig.entry, microConfig.entry);

    return webpackConfig;
}

// inject alias
function injectWebpackAlias(webpackConfig, microConfig = {}) {
    if (!webpackConfig) {
        return;
    }
    if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
    }
    if (!webpackConfig.resolve.alias) {
        webpackConfig.resolve.alias = {};
    }
    Object.assign(webpackConfig.resolve.alias, microConfig.resolveAlias);
    return webpackConfig;
}

// 去重复
function uniqArray(webpackConfig, microConfig = {}) {
    if (!webpackConfig) {
        return null;
    }
    if (webpackConfig.resolve && webpackConfig.resolve.modules && Array.isArray(webpackConfig.resolve.modules)) {
        const resolveModules = [ ...new Set(webpackConfig.resolve.modules) ];
        if (resolveModules.length > 0 && microConfig.nodeModules === resolveModules[resolveModules.length - 1]) {
            // 将最后一个放在第一位
            resolveModules.unshift(resolveModules.pop());
        }
        webpackConfig.resolve.modules = resolveModules;
    }
    if (webpackConfig.entry) {
        const entry = webpackConfig.entry;
        if (typeof entry === 'object') {
            Object.keys(entry).forEach(key => {
                if (Array.isArray(entry[key])) {
                    entry[key] = [ ...new Set(entry[key]) ];
                }
            });
        }
    }
    return webpackConfig;
}


function webpackMerge(webpackConfig = {}, opts = {}) {
    let config = patchWebpack(opts.config);
    const names = opts.micros;
    if (!names || names.length <= 0) {
        // inject self
        injectWebpackAlias(config, opts.config);
        return merge.smart(webpackConfig, config);
    }

    const microConfigs = [];
    names.forEach(key => {
        const microConfig = opts.microsConfig[key];
        if (microConfig) {
            const wc = patchWebpack(microConfig);
            // inject
            injectWebpackAlias(wc, microConfig);

            microConfigs.push(wc);
        }
    });

    if (microConfigs.length) {
        config = merge.smart(webpackConfig, ...microConfigs, config);
    }
    // inject self
    injectWebpackAlias(config, opts.config);

    return uniqArray(config, opts.config);
}

module.exports = webpackMerge;
