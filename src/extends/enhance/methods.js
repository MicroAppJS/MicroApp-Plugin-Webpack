'use strict';

module.exports = (api, opts) => {

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

    // plugin webpack
    api.registerMethod('modifyChainWebpackPluginConfig', {
        type: api.API_TYPE.MODIFY,
        description: '合并所有 plugin 之后提供 webpack-chain 进行再次修改事件',
    });
    api.registerMethod('onChainWebpcakPluginConfig', {
        type: api.API_TYPE.EVENT,
        description: '修改所有 plugin 之后提供 webpack-chain 进行查看事件',
    });
    api.registerMethod('modifyWebpackPluginConfig', {
        type: api.API_TYPE.MODIFY,
        description: '合并所有 plugin 之后提供 webpack config 进行再次修改事件',
    });
};
