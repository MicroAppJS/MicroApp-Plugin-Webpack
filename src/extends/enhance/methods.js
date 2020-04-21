'use strict';

module.exports = {
    createWebpackChainInstance: {
        type: 'MODIFY',
        description: '在 webpack 配置开始前提供一个 webpack-chain 实例.（用于内部特殊场景）',
    },

    modifyWebpackChain: {
        type: 'MODIFY',
        description: '合并之后提供 webpack-chain 进行再次修改事件',
    },

    onWebpcakChain: {
        type: 'EVENT',
        description: '修改之后提供 webpack-chain 进行查看事件',
    },

    modifyWebpackConfig: {
        type: 'MODIFY',
        description: '合并之后提供 webpack config 进行再次修改事件',
    },

    onWebpcakConfig: {
        type: 'EVENT',
        description: '修改之后提供 webpack config 进行查看事件',
    },
};
