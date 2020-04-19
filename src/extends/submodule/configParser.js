'use strict';

const { hash, tryRequire, path } = require('@micro-app/shared-utils');

const SUB_MODULES_FILE_NAME = 'subsidiary';

module.exports = function configParser(selfConfig = {}) {
    const originalConfig = selfConfig.originalConfig || {};
    const subModule = originalConfig.subModule || {};

    function entry() {
        const entry = subModule.entry || {};
        // fix entry path
        if (typeof entry === 'object') {
            Object.keys(entry).forEach(key => {
                const _entrys = entry[key];
                if (Array.isArray(_entrys)) {
                    entry[getNewKey(key)] = _entrys.map(item => {
                        if (!tryRequire.resolve(item)) {
                            return path.resolve(selfConfig.root, item);
                        }
                        return item;
                    });
                } else if (typeof _entrys === 'string') {
                    if (!tryRequire.resolve(_entrys)) {
                        entry[getNewKey(key)] = [ path.resolve(selfConfig.root, _entrys) ];
                    }
                }
            });
        } else if (Array.isArray(entry)) {
            return {
                [getNewKey('index')]: entry.map(item => {
                    if (!tryRequire.resolve(item)) {
                        return path.resolve(selfConfig.root, item);
                    }
                    return item;
                }),
            };
        } else if (typeof entry === 'string') {
            return {
                [getNewKey('index')]: [ path.resolve(selfConfig.root, entry) ],
            };
        }
        return entry;
    }

    function prefix() {
        const _prefix = subModule.prefix || SUB_MODULES_FILE_NAME;
        return `${_prefix}-`;
    }

    function namespace() {
        const key = hash(selfConfig.key);
        const _namespace = subModule.namespace || key;
        return _namespace;
    }

    function fileName() {
        return `manifest/${namespace()}.json`;
    }

    function getNewKey(key) {
        return `${prefix()}_${namespace()}-${key}`;
    }

    return {
        entry,
        namespace,
        prefix,
        fileName,
    };
};

