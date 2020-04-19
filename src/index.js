'use strict';

const extendConfigs = [
    'webpack',
    'enhance',
].concat([
    'unified/base',
    'unified/app',
    'unified/css',
    'unified/rules',
    'unified/babel',
    'unified/vue',
    'unified/plugins',
    'unified/prod',
], [
    'submodule',
]);

const commands = [
    'build',
    'serve',
    'inspect',
];

const { SKIP_CONTEXT, DEPENDENCIES_PLUGIN } = require('./config');

// 只能通过集中初始化去实现, 不可进行插件注册(registerPlugins). 否则顺序不可控.
module.exports = [
    ...extendConfigs.map(name => {
        const item = require(`./extends/${name}`);
        if (!item.configuration) {
            item.configuration = {};
        }
        if (!item.configuration.alias) {
            item.configuration.alias = `extends-${name.replace(/\//, '_')}`;
        }
        // skipContext
        if (name.startsWith('unified/')) {
            if (!item.configuration.skipContext) {
                item.configuration.skipContext = [];
            }
            item.configuration.skipContext.push( // 统一适配当 --pure-webpack-unified-config 存在时，不使用所有内置配置
                ...SKIP_CONTEXT
            );
        }
        return item;
    }),

    ...commands.map(name => {
        const item = require(`./commands/${name}`);
        if (!item.configuration) {
            item.configuration = {};
        }
        if (!item.configuration.alias) {
            item.configuration.alias = `commands-${name.replace(/\//, '_')}`;
        }
        // dependencies
        if (!name.startsWith('inspect')) {
            if (!item.configuration.dependencies) {
                item.configuration.dependencies = [];
            }
            item.configuration.dependencies.push( // 除了 inspect，所有 command 都需要依赖 cli 的方法
                ...DEPENDENCIES_PLUGIN
            );
        }
        return item;
    }),
];
