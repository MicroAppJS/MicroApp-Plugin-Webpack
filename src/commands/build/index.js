'use strict';

const defaults = {
    clean: false,
    target: 'app',
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
            '--type <type>': 'adapter type, eg. [ webpack, etc. ].',
            '--dest': 'specify output directory',
            '--clean': 'remove the dist directory before building the project',
            '--target': `app | lib | plugin (default: ${defaults.target})`,
        },
        details: `
Examples:
    ${chalk.gray('# watch')}
    micro-app build --watch
            `.trim(),
    }, async args => {
        const logger = api.logger;

        // TODO 兼容, 下个版本删除
        if (args.t && !args.type) {
            args.type = args.t;
            logger.warn('you should be use "--type <type>"!!!');
        }

        for (const key in defaults) {
            if (args[key] == null) {
                args[key] = defaults[key];
            }
        }

        const mode = args.mode || api.mode;

        const webpack = tryRequire('webpack');
        if (!webpack) {
            logger.throw('[build]', 'Not Found "webpack"!');
        }

        const options = api.config || {};

        api.applyPluginHooks('beforeBuild', { args });

        const webpackConfig = api.resolveWebpackConfig({
            target: args.target,
        });

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
                spinner.info('Build Done');

                if (err) {
                    // 在这里处理错误
                    api.applyPluginHooks('onBuildFail', { err, args });
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    // 在这里处理错误
                    api.applyPluginHooks('onBuildFail', { stats, args });
                    // console.warn(stats);
                    return reject('Build failed with errors.');
                }

                if (!args.silent) {
                    const targetDirShort = path.relative(api.root, targetDir);

                    const formatStats = require('./formatStats');
                    logger.info(formatStats(stats, targetDirShort, api));

                    if (args.target === 'app') {
                        if (!args.watch) {
                            logger.success(`Build complete. The ${chalk.cyan(targetDirShort)} directory is ready to be deployed.`);
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
            api.logger.success('>>> Build Success !!!');
        }).catch(e => {
            api.logger.error('>>> Build Error >>>', e);
        });
    });
};

module.exports.configuration = {
    description: 'webpack build command',
};
