'use strict';

const defaults = {
    host: '0.0.0.0',
    port: 8080,
    https: false,
};

module.exports = function serveCommand(api, opts) {

    const registerMethods = require('./methods');
    registerMethods(api);

    const logger = api.logger;

    api.modifyCreateDevServer(() => {

        const { _, tryRequire, chalk, openBrowser, Env, semver } = require('@micro-app/shared-utils');
        const url = require('url');
        const launchEditorMiddleware = require('launch-editor-middleware');
        const portfinder = require('portfinder');
        const prepareURLs = require('../../utils/prepareURLs');
        const prepareProxy = require('../../utils/prepareProxy');
        const validateWebpackConfig = require('../../utils/validateWebpackConfig');
        const isAbsoluteUrl = require('../../utils/isAbsoluteUrl');

        function addConfig(id, fn) {
            if (tryRequire.resolve(id)) {
                return fn(id);
            }
            logger.warn('[serve]', `Not Found "${id}" !`);
        }

        return async function({ args }) {
            const mode = api.mode;

            const webpack = tryRequire('webpack');
            if (!webpack) {
                logger.throw('[serve]', 'Not Found "webpack"!');
            }
            const WebpackDevServer = tryRequire('webpack-dev-server');
            if (!WebpackDevServer) {
                logger.throw('[serve]', 'Not Found "webpack-dev-server"!');
            }

            const webpackVersion = require('webpack/package.json').version;
            const webpackDevServerVersion = require('webpack-dev-server/package.json').version;

            const isInContainer = checkInContainer();
            const isProduction = mode === 'production';

            const options = api.config || {};

            const spinner = logger.spinner(`Starting for ${mode}...`);

            // configs that only matters for dev server
            api.modifyChainWebpackConfig(webpackChain => {

                // webpack 4
                const isWebpack4 = semver.satisfies(webpackVersion, '>=4');

                if (mode !== 'production' && mode !== 'test') {
                    webpackChain
                        .devtool('cheap-module-eval-source-map');

                    addConfig('webpack/lib/HotModuleReplacementPlugin', id => {
                        webpackChain
                            .plugin('hmr')
                            .use(require(id));
                    });

                    if (isWebpack4) {
                        // https://github.com/webpack/webpack/issues/6642
                        // https://github.com/vuejs/vue-cli/issues/3539
                        webpackChain
                            .output
                            .globalObject('(typeof self !== \'undefined\' ? self : this)');
                    }

                    if (options.devServer && options.devServer.progress !== false) {
                        addConfig('webpack/lib/ProgressPlugin', id => {
                            webpackChain
                                .plugin('progress')
                                .use(require(id), [
                                    {
                                        modules: false,
                                        profile: false,
                                        handler: (percentage, message /* , ...args */) => {
                                            if (spinner && percentage <= 0) {
                                                spinner.start();
                                            }
                                            if (spinner) {
                                                spinner.text = Number(percentage * 100).toFixed(2) + '%  ' + chalk.gray(`( ${message} )`);
                                            }
                                            // api.logger.logo(percentage, message, ...args);
                                            if (spinner && percentage >= 1) {
                                                spinner.succeed('Compiled Done!');
                                            }
                                        },
                                    },
                                ]);
                        });
                    }
                }
                return webpackChain;
            });

            const webpackConfig = api.resolveWebpackConfig({
                target: args.target,
            });

            // check for common config errors
            validateWebpackConfig(webpackConfig, api, options);

            const root = api.root;

            // load user devServer options with higher priority than devServer
            // in webpack config
            const projectDevServerOptions = Object.assign(
                webpackConfig.devServer || {},
                options.devServer || {}
            );

            // entry arg
            const entry = args.entry;
            if (entry && _.isString(entry)) {
                webpackConfig.entry = {
                    app: api.resolve(entry),
                };
            }

            // resolve server options
            const useHttps = args.https || projectDevServerOptions.https || defaults.https;
            const protocol = useHttps ? 'https' : 'http';

            const host = args.host || process.env.HOST || projectDevServerOptions.host || defaults.host;
            portfinder.basePort = args.port || process.env.PORT || projectDevServerOptions.port || defaults.port;
            const port = await portfinder.getPortPromise();

            const rawPublicUrl = args.public || projectDevServerOptions.public;
            const publicUrl = rawPublicUrl
                ? /^[a-zA-Z]+:\/\//.test(rawPublicUrl)
                    ? rawPublicUrl
                    : `${protocol}://${rawPublicUrl}`
                : null;

            const urls = prepareURLs(
                protocol,
                host,
                port,
                isAbsoluteUrl(options.publicPath) ? '/' : options.publicPath
            );

            const localUrlForBrowser = publicUrl || urls.localUrlForBrowser;

            const proxySettings = prepareProxy(
                projectDevServerOptions.proxy,
                options.staticPaths || []
            );

            // inject dev & hot-reload middleware entries
            if (!isProduction) {
                const sockjsUrl = publicUrl
                // explicitly configured via devServer.public
                    ? `?${publicUrl}/sockjs-node`
                    : isInContainer
                    // can't infer public network url if inside a container...
                    // use client-side inference (note this would break with non-root publicPath)
                        ? ''
                    // otherwise infer the url
                        : '?' + url.format({
                            protocol,
                            port,
                            hostname: urls.lanUrlForConfig || 'localhost',
                            pathname: '/sockjs-node',
                        });
                const devClients = [
                    // dev server client
                    require.resolve('webpack-dev-server/client') + sockjsUrl,
                    // hmr client
                    require.resolve(projectDevServerOptions.hotOnly
                        ? 'webpack/hot/only-dev-server'
                        : 'webpack/hot/dev-server'),
                    // TODO custom overlay client
                    // `@vue/cli-overlay/dist/client`
                ];
                if (process.env.APPVEYOR) {
                    devClients.push('webpack/hot/poll?500');
                }
                // inject dev/hot client
                addDevClientToEntry(webpackConfig, devClients);
            }

            // create compiler
            const compiler = webpack(webpackConfig);

            const isWebpackDevServer3 = semver.satisfies(webpackDevServerVersion, '>=3');

            const contentBase = Array.isArray(options.staticPaths) ? (options.staticPaths.length ? options.staticPaths : false) : options.staticPaths || false;

            // create server
            const server = new WebpackDevServer(compiler, Object.assign(isWebpackDevServer3 ? {
                logLevel: 'silent',
            } : {}, {
                clientLogLevel: 'silent',
                historyApiFallback: {
                    disableDotRule: true,
                    rewrites: genHistoryApiFallbackRewrites(options.publicPath, options.pages),
                },
                contentBase,
                watchContentBase: !isProduction,
                hot: !isProduction,
                compress: isProduction,
                publicPath: options.publicPath,
                // TODO disable this
                overlay: isProduction
                    ? false
                    : { warnings: false, errors: true },
            }, projectDevServerOptions, {
                https: useHttps,
                proxy: proxySettings,
                // eslint-disable-next-line no-shadow
                before(app, server) {
                    // launch editor support.
                    // this works with vue-devtools & @vue/cli-overlay
                    app.use('/__open-in-editor', launchEditorMiddleware(() => console.log(
                        'To specify an editor, specify the EDITOR env variable or ' +
            'add "editor" field to your Vue project config.\n'
                    )));
                    // allow other plugins to register middlewares, e.g. PWA
                    api.applyPluginHooks('beforeDevServerMiddleware', { app, server, args });

                    // apply in project middlewares
                    projectDevServerOptions.before && projectDevServerOptions.before(app, server);

                    api.applyPluginHooks('onDevServerMiddleware', { app, server, args });
                },
                after(app, server) {
                    // apply in project middlewares
                    projectDevServerOptions.after && projectDevServerOptions.after(app, server);

                    api.applyPluginHooks('afterDevServerMiddleware', { app, server, args });
                },
                // avoid opening browser
                open: false,
            }));

            [ 'SIGINT', 'SIGTERM' ].forEach(signal => {
                process.once(signal, () => {
                    server.close(() => {
                        process.exit(0);
                    });
                });
            });

            return new Promise((resolve, reject) => {
                spinner.start();

                // log instructions & open browser on first compilation complete
                let isFirstCompile = true;
                const done = stats => {
                    if (isFirstCompile) {
                        spinner.stop();
                    }

                    if (stats.hasErrors()) {
                        return;
                    }

                    let copied = '';
                    if (isFirstCompile && args.copy) {
                        try {
                            require('clipboardy').writeSync(localUrlForBrowser);
                            copied = chalk.dim('(copied to clipboard)');
                        } catch (_) {
                            /* catch exception if copy to clipboard isn't supported (e.g. WSL), see issue #3476 */
                        }
                    }

                    const networkUrl = publicUrl
                        ? publicUrl.replace(/([^/])$/, '$1/')
                        : urls.lanUrlForTerminal;

                    console.log();
                    logger.info('  App running at:');
                    logger.info(`  - Local:   ${chalk.cyan(urls.localUrlForTerminal)} ${copied}`);
                    if (!isInContainer) {
                        logger.info(`  - Network: ${chalk.cyan(networkUrl)}`);
                    } else {
                        console.log();
                        logger.warn('  It seems you are running Vue CLI inside a container.');
                        if (!publicUrl && options.publicPath && options.publicPath !== '/') {
                            console.log();
                            logger.warn('  Since you are using a non-root publicPath, the hot-reload socket');
                            logger.warn('  will not be able to infer the correct URL to connect. You should');
                            logger.warn(`  explicitly specify the URL via ${chalk.blue('devServer.public')}.`);
                            console.log();
                        }
                        logger.warn(`  Access the dev server via ${chalk.cyan(
                            `${protocol}://localhost:<your container's external mapped port>${options.publicPath}`
                        )}`);
                    }
                    console.log();

                    if (isFirstCompile) {
                        isFirstCompile = false;

                        if (!isProduction) {
                            const buildCommand = Env.hasProjectYarn(root) ? 'yarn build' : Env.hasProjectPnpm(root) ? 'pnpm run build' : 'npm run build';
                            logger.info('  Note that the development build is not optimized.');
                            logger.info(`  To create a production build, run ${chalk.cyan(buildCommand)}.`);
                        } else {
                            logger.info('  App is served in production mode.');
                            logger.info('  Note this is for preview or E2E testing only.');
                        }
                        console.log();

                        if (args.open || projectDevServerOptions.open) {
                            const pageUri = (projectDevServerOptions.openPage && typeof projectDevServerOptions.openPage === 'string')
                                ? projectDevServerOptions.openPage
                                : '';
                            openBrowser(localUrlForBrowser + pageUri);
                        }

                        // resolve returned Promise
                        // so other commands can do api.service.run('serve').then(...)
                        resolve({
                            server,
                            url: localUrlForBrowser,
                        });
                    } else {
                        // do nothing
                    }
                };

                const hooks = compiler.hooks;
                if (!hooks) {
                    compiler.plugin('done', done);
                } else {
                    compiler.hooks.done.tap('micro-app serve', done);
                }

                server.listen(port, host, err => {
                    if (err) {
                        reject(err);
                    }
                });
            });
        };
    });

};


function addDevClientToEntry(config, devClient) {
    const { entry } = config;
    if (typeof entry === 'object' && !Array.isArray(entry)) {
        Object.keys(entry).forEach(key => {
            entry[key] = devClient.concat(entry[key]);
        });
    } else if (typeof entry === 'function') {
        config.entry = entry(devClient);
    } else {
        config.entry = devClient.concat(entry);
    }
}

// https://stackoverflow.com/a/20012536
function checkInContainer() {
    const fs = require('fs');
    if (fs.existsSync('/proc/1/cgroup')) {
        const content = fs.readFileSync('/proc/1/cgroup', 'utf-8');
        return /:\/(lxc|docker|kubepods)\//.test(content);
    }
}


function genHistoryApiFallbackRewrites(baseUrl, pages = {}) {
    const path = require('path');
    const multiPageRewrites = Object
        .keys(pages)
    // sort by length in reversed order to avoid overrides
    // eg. 'page11' should appear in front of 'page1'
        .sort((a, b) => b.length - a.length)
        .map(name => ({
            from: new RegExp(`^/${name}`),
            to: path.posix.join(baseUrl, pages[name].filename || `${name}.html`),
        }));
    return [
        ...multiPageRewrites,
        { from: /./, to: path.posix.join(baseUrl, 'index.html') },
    ];
}

module.exports.configuration = {
    description: 'webpack hot serve for dev',
    // mode: 'development',
};
