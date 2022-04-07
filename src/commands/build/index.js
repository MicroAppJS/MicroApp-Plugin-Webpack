'use strict';

const defaults = {
    clean: false,
};

module.exports = function buildCommand(api, opts) {

    const { tryRequire, chalk, fs, _ } = require('@micro-app/shared-utils');

    const registerMethods = require('./methods');
    registerMethods(api);

    api.changeCommandOption('build', oldOpts => {
        const newOpts = _.cloneDeep(oldOpts);
        Object.assign(newOpts.options, {
            '--clean': 'remove the dist directory before building the project',
            '--target <target>': 'app | lib | node etc. (default: "app")',
        });
        return newOpts;
    });

    api.modifyCreateBuildProcess(() => {
        const path = require('path');

        const logger = api.logger;

        const webpack = tryRequire('webpack');
        if (!webpack) {
            logger.throw('[build]', 'Not Found "webpack"!');
        }

        const validateWebpackConfig = require('../../utils/validateWebpackConfig');

        return async function({ args }) {

            for (const key in defaults) {
                if (args[key] == null) {
                    args[key] = defaults[key];
                }
            }

            const webpackConfig = api.resolveWebpackConfig(undefined, api.target);

            const options = api.config || {};

            // check for common config errors
            validateWebpackConfig(webpackConfig, api, options, api.target);

            const targetDir = api.resolve(options.outputDir);

            const mode = args.mode || api.mode;
            const spinner = logger.spinner(`Building for ${mode}...`);

            if (args.clean) {
                await fs.remove(targetDir);
            }

            if (process.env.MICRO_APP_TEST) {
                api.logger.debug('MICRO_APP_TEST --> Exit!!!');
                return Promise.resolve();
            }

            spinner.start();
            return new Promise((resolve, reject) => {
                webpack(webpackConfig, (err, stats) => {

                    spinner.info('Build Done');

                    if (err) {
                        // 在这里处理错误
                        api.applyPluginHooks('onBuildFail', { err, args });
                        return reject(err);
                    }

                    if (stats.hasErrors()) {
                        // 在这里处理错误
                        api.applyPluginHooks('onBuildFail', { stats, args });
                        console.warn(stats.toString({
                            chunks: false, // Makes the build much quieter
                            colors: true, // Shows colors in the console
                        }));
                        return reject('Build failed with errors.');
                    }

                    if (!args.silent) {
                        const targetDirShort = path.relative(api.root, targetDir);

                        const formatStats = require('./formatStats');
                        logger.info(formatStats(stats, targetDirShort, api));

                        logger.success(`Build complete. The ${chalk.cyan(targetDirShort)} directory is ready to be deployed.`);
                    }

                    // 处理完成
                    resolve();
                });
            }).then(() => {
                spinner.stop();
                api.applyPluginHooks('onBuildSuccess', { args });
            }).catch(err => {
                spinner.stop();
                throw err;
            });
        };
    });
};

module.exports.configuration = {
    description: 'webpack build command',
};
