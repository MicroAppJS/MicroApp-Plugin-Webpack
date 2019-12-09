'use strict';

const defaults = {
    clean: false,
    target: 'app',
};

const modifyConfig = (config, fn) => {
    if (Array.isArray(config)) {
        config.forEach(c => fn(c));
    } else {
        fn(config);
    }
};

module.exports = function buildCommand(api, opts) {

    const { tryRequire, chalk, fs } = require('@micro-app/shared-utils');

    const registerMethods = require('./methods');
    registerMethods(api);

    // start
    api.registerCommand('build', {
        description: 'build for production',
        usage: 'micro-app build [options]',
        options: {
            '--mode': 'specify env mode (default: development)',
            '--type <type>': 'adapter type, eg. [ webpack, vusion ].',
            '--dest': 'specify output directory',
            '--watch': 'watch for changes',
            '--clean': 'remove the dist directory before building the project',
            '--target': `app | lib (default: ${defaults.target})`,
        },
        details: `
Examples:
    ${chalk.gray('# vusion')}
    micro-app build --type vusion
          `.trim(),
    }, async args => {
        for (const key in defaults) {
            if (args[key] == null) {
                args[key] = defaults[key];
            }
        }

        const mode = api.mode;
        const logger = api.logger;

        const webpack = tryRequire('webpack');
        if (!webpack) {
            logger.throw('[build]', 'Not Found "webpack"!');
        }

        const options = api.config || {};

        api.applyPluginHooks('beforeBuild', { args });

        const webpackConfig = api.resolveWebpackConfig();

        if (args.watch) {
            modifyConfig(webpackConfig, config => {
                config.watch = true;
            });
        }

        if (args.dest) {
            // Override outputDir before resolving webpack config as config relies on it (#2327)
            options.outputDir = args.dest;
        }

        const path = require('path');

        const targetDir = api.resolve(options.outputDir);

        const spinner = logger.spinner(`Building for ${mode}...`);

        if (args.clean) {
            await fs.remove(targetDir);
        }

        return new Promise((resolve, reject) => {
            spinner.start();
            webpack(webpackConfig, (err, stats) => {

                api.applyPluginHooks('afterBuild', { args });

                spinner.stop();

                if (err) {
                    // 在这里处理错误
                    api.applyPluginHooks('onBuildFail', { err, args });
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    return reject('Build failed with errors.');
                }

                if (!args.silent) {
                    const targetDirShort = path.relative(api.root, targetDir);

                    const formatStats = require('./formatStats');
                    logger.info(formatStats(stats, targetDirShort, api));

                    if (args.target === 'app') {
                        if (!args.watch) {
                            logger.success(`Build complete. The ${chalk.cyan(targetDirShort)} directory is ready to be deployed.`);
                            logger.info(`Check out deployment instructions at ${chalk.cyan('https://cli.vuejs.org/guide/deployment.html')}\n`);
                        } else {
                            logger.success('Build complete. Watching for changes...');
                        }
                    }
                }

                api.applyPluginHooks('onBuildSuccess', { args });

                // 处理完成
                resolve();
            });
        }).then(() => {
            api.logger.success('>>> Build Success >>>');
        }).catch(e => {
            api.logger.error('>>> Build Error >>>', e);
        });
    });
};

module.exports.configuration = {
    description: 'webpack build command',
};
