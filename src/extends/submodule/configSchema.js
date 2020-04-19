'use strict';

module.exports = {
    additionalProperties: true,
    properties: {
        subModule: {
            description: '子模块配置. ( object )',
            type: 'object',
            additionalProperties: true,
            properties: {
                entry: {
                    description: '入口配置. ( object )',
                    type: 'object',
                },
                publicPath: {
                    description: 'public resource path. ( stirng )',
                    type: 'string',
                },
                outputDir: {
                    description: 'output resource path. ( stirng )',
                    type: 'string',
                },
            },
            required: [ 'entry' ],
        },
    },
    type: 'object',
};
