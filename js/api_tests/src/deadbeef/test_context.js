'use strict';

const path = require('path');

const TestContextBase = require('../test_context_base');
const PlayerController = require('./player_controller');

class TestContext extends TestContextBase
{
    initConfig(config)
    {
        config.playerId = 'deadbeef';

        config.pluginBuildDir = path.join(
            config.rootDir,
            'server',
            'build',
            config.buildType,
            'src',
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
