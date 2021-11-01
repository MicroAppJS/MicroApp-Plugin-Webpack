'use strict';

const { _, hash, tryRequire, path } = require('@micro-app/shared-utils');

const DEFAULT_KEY = 'main';

module.exports = function configParser(selfConfig, extraConfig = {}) {
    const originalConfig = selfConfig.originalConfig || {};
    const webpackConfig = originalConfig.webpack || {};

    function staticPaths() {
        // String | Array
        const staticPath = originalConfig.staticPath || [];
        const staticPaths = [];
        if (staticPath && typeof staticPath === 'string') {
            staticPaths.push(staticPath);
        } else if (Array.isArray(staticPath)) {
            staticPaths.push(...staticPath);
        }
        return staticPaths.filter(item => {
            return !!item;
        }).map(item => {
            if (!tryRequire.resolve(item)) {
                return path.resolve(selfConfig.root, item);
            }
            return item;
        });
    }

    // @Deprecated
    function htmls() {
        if (extraConfig.disabled) {
            return [];
        }
        // 支持 array
        const htmls = originalConfig.htmls || (!originalConfig.html && webpackConfig.plugins && Array.isArray(webpackConfig.plugins) && webpackConfig.plugins.filter(item => {
            const constru = item.constructor;
            if (constru && constru.name) {
                const constructorName = constru.name;
                if (constructorName === 'HtmlWebpackPlugin') {
                    return true;
                }
            }
            return false;
        }).map(item => item.options)) || []; // 兼容
        const _html = originalConfig.html; // 兼容
        if (_html && typeof _html === 'object') {
            htmls.unshift(_html);
        }
        htmls.forEach(item => {
            if (item && item.template) {
                const template = item.template;
                if (!tryRequire.resolve(template)) {
                    item.template = path.resolve(selfConfig.root, template);
                }
            }
        });
        return htmls;
    }

    function html() {
        if (extraConfig.disabled) {
            return {};
        }
        // 支持 array
        const html = originalConfig.html || {};
        if (typeof html === 'object') {
            Object.keys(html).forEach(key => {
                const _htmls = html[key];
                if (Array.isArray(_htmls)) {
                    html[key] = _htmls.map(item => {
                        if (!tryRequire.resolve(item.template)) {
                            item.template = path.resolve(selfConfig.root, item.template);
                        }
                        return item;
                    });
                } else if (typeof _htmls === 'string') {
                    if (!tryRequire.resolve(_htmls)) {
                        html[key] = {
                            template: path.resolve(selfConfig.root, _htmls),
                        };
                    }
                }
            });
        } else if (Array.isArray(html)) {
            return {
                [DEFAULT_KEY]: html.map(item => {
                    if (!tryRequire.resolve(item.template)) {
                        item.template = path.resolve(selfConfig.root, item.template);
                    }
                    return item;
                }),
            };

        } else if (typeof html === 'string') {
            return {
                [DEFAULT_KEY]: {
                    template: path.resolve(selfConfig.root, html),
                },
            };
        }
        return html;
    }

    function entry() {
        if (extraConfig.disabled) {
            return {};
        }
        const entry = originalConfig.entry || webpackConfig.entry || {}; // 兼容
        // fix entry path
        if (typeof entry === 'object') {
            Object.keys(entry).forEach(key => {
                const _entrys = entry[key];
                if (Array.isArray(_entrys)) {
                    entry[key] = _entrys.map(item => {
                        if (!tryRequire.resolve(item)) {
                            return path.resolve(selfConfig.root, item);
                        }
                        return item;
                    });
                } else if (typeof _entrys === 'string') {
                    if (!tryRequire.resolve(_entrys)) {
                        entry[key] = [ path.resolve(selfConfig.root, _entrys) ];
                    }
                }
            });
        } else if (Array.isArray(entry)) {
            return {
                [DEFAULT_KEY]: entry.map(item => {
                    if (!tryRequire.resolve(item)) {
                        return path.resolve(selfConfig.root, item);
                    }
                    return item;
                }),
            };
        } else if (typeof entry === 'string') {
            return {
                [DEFAULT_KEY]: [ path.resolve(selfConfig.root, entry) ],
            };
        }
        return entry;
    }

    function namespace() {
        const _namespace = selfConfig.namespace || hash(selfConfig.key);
        return _namespace;
    }

    return {
        staticPaths,
        htmls,
        html,
        entry,
        namespace,
    };
};
