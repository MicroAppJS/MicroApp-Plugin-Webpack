'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '../');

const config = {
    type: '', // types 类型
    webpack: { }, // webpack 配置 (只有自己使用)

    entry: {
        main: './simple/client/main.js',
    },

    htmls: [
        {
            filename: 'index.html',
            hash: true,
            chunks: [ 'main' ],
            template: './simple/client/index.html',
        },
    ],

    outputDir: path.resolve(ROOT, 'dist'),
    // publicPath: '/',

    // staticPath: '',

    // devServer: {},

    alias: {
        api: 'abc',
        config: {
            link: 'abc',
            description: '配置',
        },
        service: {
            link: 'abc',
            description: '接口',
            type: 'server',
        },
    },

    // 服务配置
    server: {
        entry: '', // 服务端入口
        port: 8088, // 服务端口号
        options: {
            // 服务端回调参数
        },
    },
};


config.plugins = [
    ROOT,
];

if (process.env.NODE_ENV === 'test') {
    config.plugins.push(
        '@micro-app/plugin-compatible'
    );
}

config.plugins.push(
    '@micro-app/plugin-deploy' // test
);

module.exports = config;
