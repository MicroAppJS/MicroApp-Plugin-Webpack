'use strict';

module.exports = function validateWebpackConfig(
    webpackConfig,
    api,
    options,
    target = 'app'
) {
    const logger = api.logger;

    const singleConfig = Array.isArray(webpackConfig)
        ? webpackConfig[0]
        : webpackConfig;

    const actualTargetDir = singleConfig.output.path;

    if (actualTargetDir !== api.resolve(options.outputDir)) {
        // user directly modifies output.path in configureWebpack or chainWebpack.
        // this is not supported because there's no way for us to give copy
        // plugin the correct value this way.
        logger.warn('[validate]', 'outputDir:', options.outputDir, '!== output.path:', singleConfig.output.path);
        logger.error(
            'Configuration Error: ' +
            'Avoid modifying webpack output.path directly. ' +
            'Use the "outputDir" option instead.'
        );
        // fixed
        options.outputDir = singleConfig.output.path;
    }

    if (actualTargetDir === api.root) {
        logger.warn('[validate]', 'root:', api.root, '!== output.path:', singleConfig.output.path);
        logger.throw(
            'Configuration Error: ' +
            'Do not set output directory to project root.'
        );
    }

    if (target === 'app' && singleConfig.output.publicPath !== options.publicPath) {
        logger.warn('[validate]', 'publicPath:', options.publicPath, '!== output.publicPath:', singleConfig.output.publicPath);
        logger.error(
            'Configuration Error: ' +
            'Avoid modifying webpack output.publicPath directly. ' +
            'Use the "publicPath" option instead.'
        );
        // fixed
        options.publicPath = singleConfig.output.publicPath;
    }
};
