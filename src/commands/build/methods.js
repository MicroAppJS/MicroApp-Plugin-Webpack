'use strict';

module.exports = api => {

    api.registerMethod('onBuildSuccess', {
        type: api.API_TYPE.EVENT,
        description: '构建成功时事件',
    });

    api.registerMethod('onBuildFail', {
        type: api.API_TYPE.EVENT,
        description: '构建失败时事件',
    });

};
