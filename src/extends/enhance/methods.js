'use strict';

module.exports = (api, opts) => {

    api.registerMethod('createChainWebpackConfigInstance', {
        type: api.API_TYPE.MODIFY,
        description: '在 webpack 配置开始前提供一个 webpack-chain 实例.（用于内部特殊场景）',
    });

    api.registerMethod('modifyChainWebpackConfig', {
        type: api.API_TYPE.MODIFY,
        description: '合并之后提供 webpack-chain 进行再次修改事件',
    });

    api.registerMethod('onChainWebpcakConfig', {
        type: api.API_TYPE.EVENT,
        description: '修改之后提供 webpack-chain 进行查看事件',
    });

    api.registerMethod('modifyWebpackConfig', {
        type: api.API_TYPE.MODIFY,
        description: '合并之后提供 webpack config 进行再次修改事件',
    });
};
