'use strict';

module.exports = function configCombine(obj, key) {

    function pages() {
        const entry = obj.entry;
        const htmls = obj.htmls || [];
        const dlls = obj.dlls || [];
        const html = Array.isArray(htmls) && htmls[0] || {};

        return {
            [key]: {
                // page 的入口
                entry,
                ...html,
                htmls,
                dlls,
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
