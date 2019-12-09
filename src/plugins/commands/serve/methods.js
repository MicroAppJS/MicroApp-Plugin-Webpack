'use strict';

module.exports = api => {

    api.registerMethod('beforeDevServerMiddleware', {
        type: api.API_TYPE.EVENT,
        description: '开发服务业务前中间件事件, 适用于 serve 开发环境命令中',
    });

    api.registerMethod('onDevServerMiddleware', {
        type: api.API_TYPE.EVENT,
        description: '开发服务业务中中间件事件, 适用于 serve 开发环境命令中',
    });

    api.registerMethod('afterDevServerMiddleware', {
        type: api.API_TYPE.EVENT,
        description: '开发服务业务后中间件事件, 适用于 serve 开发环境命令中',
    });

};
