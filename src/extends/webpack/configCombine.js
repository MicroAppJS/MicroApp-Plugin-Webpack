'use strict';

module.exports = function configCombine(obj, key) {

    function pages() {
        const entry = obj.entry;
        const html = Array.isArray(obj.htmls) && obj.htmls[0] || {};

        return {
            [key]: {
                // page 的入口
                entry,
                ...html,
            },
        };
    }

    return {
        pages,
    };
};
