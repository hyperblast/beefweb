'use strict';

const path = require('path');

const TestContextBase = require('../test_context_base');
const PlayerController = require('./player_controller');

class TestContext extends TestContextBase
{
    initConfig(config)
    {
        config.pluginBuildDir = path.join(
            config.rootDir,
            'server',
            'build',
            config.buildType,
            'src',
            'player_foobar2000',
            config.buildType);

        config.pluginFile = 'foo_beefweb.dll';
        config.playerDir = path.join(config.toolsDir, 'foobar2000');
    }

    createController(config)
    {
        return new PlayerController(config);
    }
}

module.exports = TestContext;
