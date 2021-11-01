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
            const newEntry = {};
            Object.keys(entry).forEach(key => {
                const _entrys = entry[key];
                if (Array.isArray(_entrys)) {
                    newEntry[getNewKey(key)] = _entrys.map(item => {
                        if (!tryRequire.resolve(item)) {
                            return path.resolve(selfConfig.root, item);
                        }
                        return item;
                    });
                } else if (typeof _entrys === 'string') {
                    if (!tryRequire.resolve(_entrys)) {
                        newEntry[getNewKey(key)] = [ path.resolve(selfConfig.root, _entrys) ];
                    }
                }
            });
            return newEntry;
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
        return _prefix;
    }

    function namespace() {
        const _namespace = subModule.namespace || selfConfig.namespace || hash(selfConfig.key);
        return _namespace;
    }

    function fileName() {
        return `manifest/${namespace()}.json`;
    }

    function getNewKey(key) {
        return `${prefix()}${namespace()}-${key}`;
    }

    // 如果没有新的设置，默认会用主应用配置
    function outputDir() {
        const _outputDir = subModule.outputDir || false;
        return _outputDir;
    }

    return {
        entry,
        namespace,
        prefix,
        fileName,
        outputDir,
    };
};

