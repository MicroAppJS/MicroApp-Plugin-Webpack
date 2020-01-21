// const args = api.parseArgv();

'use strict';

const HOOK_KEY_MAP = {
    init: 'onServerInit',
    before: 'beforeServerEntry',
    after: 'afterServerEntry',
    willDone: 'onServerInitWillDone',
    done: 'onServerInitDone',
};

module.exports = function unifiedExtend(api, opts) {

    api.assertVersion('>=0.3.0');

    // TODO 补充基本配置
    api.modifyChainWebpackPluginConfig(webpackChain => {

        // entry
        const entry = createTempConfigEntry(api);
        Object.keys(entry).forEach(key => {
            webpackChain.entry(key).merge(entry[key]);
        });

        // const options = api.serverConfig || {};

        // webpackChain
        //     .context(api.root)
        //     .output
        //     .filename(outputFilename)
        //     .chunkFilename(outputFilename)
        //     .end();

        return webpackChain;
    });
};

module.exports.configuration = {
    description: 'webpack config for production',
    mode: 'production',
};


function createTempConfigEntry(api) {
    const { fs, dedent, hash, path } = require('@micro-app/shared-utils');
    const tempDir = api.tempDir;
    const pluginsDir = path.resolve(tempDir, 'plugins');
    fs.ensureDirSync(pluginsDir);
    const allplugins = api.service.plugins;
    const filterPlugins = [];

    const builtInFlag = Symbol.for('built-in');
    allplugins.forEach(plugin => {
        const id = plugin.id;
        const flag = plugin[builtInFlag];
        if (id.startsWith('built-in:') || flag) {
            return;
        }
        const link = plugin.link;
        if (!filterPlugins.some(item => (item.id === id && item.link === link))) {
            filterPlugins.push(plugin);
        }
    });
    const aliasPlugins = filterPlugins.map(plugin => {
        const id = plugin.id;
        const link = plugin.link;
        const aliasKey = hash(`${id}_${link}`);
        return {
            id, link, aliasKey,
        };
    });
    // TODO __dirname 引用有问题，需要优化。server 参数需要优化
    const entryTexts = [ ];
    aliasPlugins.forEach(({ id, link, aliasKey, opts = {} }) => {
        const tempIndex = path.resolve(pluginsDir, `${aliasKey}.js`);
        // 创建临时文件
        fs.writeFileSync(tempIndex, dedent`
            'use strict';
            module.exports = require('${link}');
        `);
        // entryTexts.push(`{id:"${id}", link: '${link}'}`);
        entryTexts.push(`{id:"${id}", link: path.resolve(__dirname, '${aliasKey}.js'), opts: ${JSON.stringify(opts)}}`);
    });

    // hooks, entrys
    // TODO 需要迁移至适配兼容模块
    const tempServerHooksAndEntrysText = createTempPlugin(api);
    if (tempServerHooksAndEntrysText) {
        const aliasKey = 'tempServerHooksAndEntrysText';
        const tempIndex = path.resolve(pluginsDir, `${aliasKey}.js`);
        // 创建临时文件
        fs.writeFileSync(tempIndex, tempServerHooksAndEntrysText);
        entryTexts.push(`{id:"temp:serverHooksAndEntrys", link: path.resolve(__dirname, '${aliasKey}.js')}`);
    }

    const plugins = `[${entryTexts.join(',\n')}]`;
    const entryIndex = writeConfigFile(pluginsDir, {
        version: api.version,
        plugins, server: api.serverConfig || {},
    });
    return {
        ...aliasPlugins.reduce((obj, { link, aliasKey }) => {
            if (aliasKey) {
                obj[aliasKey] = [ link ];
            }
            return obj;
        }, {}),
        'micro-app.config': [ entryIndex ],
    };
}

function createTempPlugin(api) {
    const { dedent } = require('@micro-app/shared-utils');
    const serverConfig = api.serverConfig || {};
    const texts = [];
    (serverConfig.hooks || []).forEach((item, index) => {
        texts.push(convertHook(item, index));
    });
    (serverConfig.entrys || []).forEach((item, index) => {
        texts.push(convertEntry(item, index));
    });

    return dedent`
    'use strict';
    module.exports = function(api) {
        ${texts.join('\n')}
    };
    `;
}

function convertHook({ link, key, info, options }, index) {
    const { dedent } = require('@micro-app/shared-utils');
    const hookName = HOOK_KEY_MAP[key];
    const name = info.name || '';
    return dedent`
        const hook_${name}_${key}_${index} = require('${link}');
        if (hook_${name}_${key}_${index} && typeof hook_${name}_${key}_${index} === 'function') {
            api.${hookName}(params => {
                const info = JSON.parse(${JSON.stringify(info)});
                const options = JSON.parse(${JSON.stringify(options)});
                return hook_${name}_${key}_${index}(params.app, options, info);
            });
        }
    `;
}

function convertEntry({ info, options, link }, index) {
    const { dedent } = require('@micro-app/shared-utils');
    const hookName = 'onServerEntry';
    const name = info.name || '';
    return dedent`
        const entry_${name}_${index} = require('${link}');
        if (entry_${name}_${index} && typeof entry_${name}_${index} === 'function') {
            api.${hookName}(params => {
                const info = JSON.parse(${JSON.stringify(info)});
                const options = JSON.parse(${JSON.stringify(options)});
                return entry_${name}_${index}(params.app, options, info);
            });
        }
    `;
}

function writeConfigFile(root, { version, plugins, server }) {
    const { fs, dedent, path } = require('@micro-app/shared-utils');
    const entryIndex = path.resolve(root, 'main.js');
    console.warn('entryIndex: ', entryIndex);
    fs.writeFileSync(entryIndex, dedent`
        'use strict';
        const path = require('path');
        module.exports = {
            name: 'temp',
            description: '模拟配置文件1',
            version: ${JSON.stringify(version)},
            plugins: ${plugins},
            server: ${JSON.stringify(server || {})},
    };`);
    return entryIndex;
}
