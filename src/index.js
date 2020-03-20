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
            item.configuration.skipTarget.push( // 统一适配 vue-cli
                'vue-cli-plugin'
            );
        }
        return item;
    }),

    ...commands.map(name => {
        const item = require(`./commands/${name}`);
        if (item.configuration && !item.configuration.alias) {
            item.configuration.alias = `commands-${name.replace(/\//, '_')}`;
        }
        return item;
    }),
];
