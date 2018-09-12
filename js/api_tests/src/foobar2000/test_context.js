'use strict';

const path = require('path');

const TestContextBase = require('../test_context_base');
const PlayerController = require('./player_controller');

class TestContext extends TestContextBase
{
    initConfig(config)
    {
        config.playerId = 'foobar2000';

        const { BEEFWEB_TEST_FOOBAR2000_VERSION } = process.env;
        const version = BEEFWEB_TEST_FOOBAR2000_VERSION || 'v1.3';

        config.pluginBuildDir = path.join(
            config.rootDir,
            'server',
            'build',
            config.buildType,
            'src',
            'foobar2000',
            config.buildType);

        config.pluginFile = 'foo_beefweb.dll';
        config.playerDir = path.join(config.toolsDir, `foobar2000-${version}`);
    }

    createController(config)
    {
        return new PlayerController(config);
    }
}

module.exports = TestContext;
