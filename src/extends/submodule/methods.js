'use strict';

module.exports = {

    modifySubModuleWebpackChain: {
        type: 'MODIFY',
        description: '修改 SubModule webpack-chain 配置事件',
    },

    modifySubModuleWebpackConfig: {
        type: 'MODIFY',
        description: '修改 SubModule webpack config 配置事件',
    },

};
