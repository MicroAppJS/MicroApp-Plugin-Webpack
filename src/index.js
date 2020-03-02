'use strict';

const extendConfigs = [
    'webpack',
    'enhance',
    'unified/base',
    'unified/rules',
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
        if (item.configuration && !item.configuration.alias) {
            item.configuration.alias = `extends-${name.replace(/\//, '_')}`;
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
