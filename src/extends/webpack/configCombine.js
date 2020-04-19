'use strict';

module.exports = function configCombine(obj) {

    function pages() {
        const entry = obj.entry || {};
        const html = obj.html || {}; // 优先
        const htmls = obj.htmls || [];
        const _defaultHtml = Array.isArray(htmls) && htmls[0] || {};
        return Object.keys(entry).reduce((obj, key) => {
            const _entry = entry[key];
            const _html = html[key]
                || htmls.find(item => Array.isArray(item.chunks) && item.chunks.includes(key)) || _defaultHtml; // 兼容
            obj[key] = {
                entry: _entry,
                ..._html,
            };
            return obj;
        }, {});
    }

    function nodeModulesPaths() {
        const nodeModulesPath = obj.nodeModulesPath;
        if (nodeModulesPath && !Array.isArray(nodeModulesPath)) {
            return [ nodeModulesPath ].sort();
        } else if (Array.isArray(nodeModulesPath)) {
            return nodeModulesPath.sort();
        }
        return [];
    }

    return {
        pages,
        nodeModulesPaths,
    };
};
