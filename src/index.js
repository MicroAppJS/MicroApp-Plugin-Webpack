'use strict';

const extendConfigs = [
    'webpack',
    'enhance',
    'unified/base',
    'unified/app',
    'unified/css',
    'unified/rules',
    'unified/babel',
    'unified/vue',
    'unified/plugins',
    'unified/prod',
];

const commands = [
    'build',
    'serve',
    'inspect',
];

const SKIP_TARGET = [ 'pure' ]; // target
const DEPENDENCIES_PLUGIN = [ '@micro-app/cli' ]; // dependencies

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
        // skipTarget
        if (name.startsWith('unified/')) {
            if (!item.configuration.skipTarget) {
                item.configuration.skipTarget = [];
            }
            item.configuration.skipTarget.push( // 统一适配当 target = pure 时，不使用所有内置配置
                ...SKIP_TARGET
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
