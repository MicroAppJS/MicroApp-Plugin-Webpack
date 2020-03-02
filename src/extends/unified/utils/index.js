'use strict';

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

module.exports = {
    webpackVersion,
    isWebpack4,
    getAssetPath: require('./getAssetPath'),
    resolveLoaderError: require('./resolveLoaderError'),
};
