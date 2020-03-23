'use strict';

module.exports = {
    additionalProperties: true,
    properties: {
        webpack: {
            description: 'webpack 配置, 只针对自己有效. ( object )',
            type: 'object',
        },
        entry: {
            description: '入口配置. ( object )',
            type: 'object',
        },
        htmls: {
            description: '模版配置. ( array<object> )',
            items: {
                required: [ 'template' ],
                type: 'object',
            },
            minItems: 1,
            type: 'array',
        },
        staticPath: {
            description: 'static resource path. ( stirng | array<string> )',
            anyOf: [{
                items: {
                    type: 'string',
                },
                minItems: 1,
                type: 'array',
            },
            {
                type: 'string',
            }],
        },
        css: {
            description: 'css配置. ( object )',
            type: 'object',
        },
        devServer: {
            description: '开发服务器配置. ( object )',
            type: 'object',
        },
        publicPath: {
            description: 'public resource path. ( stirng )',
            type: 'string',
        },
    },
    type: 'object',
};
