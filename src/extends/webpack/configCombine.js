'use strict';

module.exports = function configCombine(obj) {

    function pages() {

        const entry = obj.entry;
        const htmls = obj.htmls || [];
        const html = Array.isArray(htmls) && htmls[0] || {};

        if (typeof entry === 'object') {
            return Object.keys(entry).reduce((obj, key) => {
                const _entry = entry[key];
                const _html = htmls.find(item => Array.isArray(item.chunks) && item.chunks.includes(key)) || html;
                obj[key] = {
                    entry: _entry,
                    ..._html,
                };
                return obj;
            }, {});
        }

        return {
            index: {
                // page 的入口
                entry,
                ...html,
            },
        };
    }

    function nodeModulesPaths() {
        const nodeModules = obj.nodeModules;
        if (nodeModules && !Array.isArray(nodeModules)) {
            return [ nodeModules ];
        } else if (Array.isArray(nodeModules)) {
            return nodeModules;
        }
        return [];
    }

    return {
        pages,
        nodeModulesPaths,
    };
};
