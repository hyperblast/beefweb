'use strict';

const path = require('path');

const TestContextBase = require('../test_context_base');
const PlayerController = require('./player_controller');

class TestContext extends TestContextBase
{
    initConfig(config)
    {
        config.playerId = 'deadbeef';

        const { BEEFWEB_TEST_DEADBEEF_VERSION } = process.env;
        const version = BEEFWEB_TEST_DEADBEEF_VERSION || 'v1.8';

        config.playerDirBase = path.join(config.toolsDir, 'deadbeef', version);

        config.pluginBuildDir = path.join(
            config.rootDir,
            'cpp',
            'build',
            config.buildType,
            'server',
            'deadbeef');

        config.pluginFiles = [
            'beefweb.so',
            'ddb_gui_dummy.so',
            'nullout2.so'
        ];

        config.deadbeefSettings = {
            'gui_plugin': 'dummy',
            'output_plugin': 'Null output plugin v2',
        };
    }

    createController(config)
    {
        return new PlayerController(config);
    }
}

module.exports = TestContext;
