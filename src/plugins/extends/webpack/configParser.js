'use strict';

const { _, tryRequire } = require('@micro-app/shared-utils');
const path = require('path');

module.exports = function configParser(obj, key) {
    const selfConfig = obj[key] || {};
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


    function publicPaths() {
        const _staticPaths = staticPaths();
        if (_staticPaths.length) {
            return _staticPaths;
        }

        // String | Array
        const publicPath = originalConfig.publicPath || [];
        const publicPaths = [];
        if (_.isString(publicPath)) {
            publicPaths.push(publicPath);
        } else if (Array.isArray(publicPath)) {
            publicPaths.push(...publicPath);
        }
        return publicPaths.filter(item => {
            return !(_.isUndefined(item) || _.isNull(item));
        }).map(item => {
            if (!tryRequire.resolve(item)) {
                return path.resolve(selfConfig.root, item);
            }
            return item;
        });
    }

    function dlls() {

        // 支持 array
        const dlls = originalConfig.dlls || [];
        const _dll = originalConfig.dll; // 兼容
        if (_dll && typeof _dll === 'object') {
            dlls.unshift(_dll);
        }
        dlls.forEach(item => {
            if (item && item.context) {
                const context = item.context;
                if (!tryRequire.resolve(context)) {
                    item.context = path.resolve(selfConfig.root, context);
                }
            }
            if (item && item.manifest) {
                const manifest = item.manifest;
                if (!tryRequire.resolve(manifest)) {
                    item.manifest = path.resolve(selfConfig.root, manifest);
                }
            }
            if (item && item.filepath) {
                const filepath = item.filepath;
                if (!tryRequire.resolve(filepath)) {
                    item.filepath = path.resolve(selfConfig.root, filepath);
                }
            }
        });
        return dlls;
    }

    function htmls() {
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

    function entry() {
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
                main: entry.map(item => {
                    if (!tryRequire.resolve(item)) {
                        return path.resolve(selfConfig.root, item);
                    }
                    return item;
                }),
            };
        } else if (typeof entry === 'string') {
            if (!tryRequire.resolve(entry)) {
                return {
                    main: [ path.resolve(selfConfig.root, entry) ],
                };
            }
        }
        return entry;
    }

    return {
        staticPaths,
        publicPaths,
        dlls,
        htmls,
        entry,
    };
};
