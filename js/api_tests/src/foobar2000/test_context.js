import path from 'path';
import TestContextBase from '../test_context_base.js';
import PlayerController from './player_controller.js';

class TestContext extends TestContextBase
{
    initConfig(config)
    {
        config.playerId = 'foobar2000';

        const { BEEFWEB_TEST_FOOBAR2000_VERSION } = process.env;
        config.playerVersion = BEEFWEB_TEST_FOOBAR2000_VERSION || 'v2.1-x64';
        config.playerDir = path.join(config.appsDir, 'foobar2000', config.playerVersion);

        config.pluginBuildDir = path.join(
            config.rootDir,
            'build',
            config.buildType,
            'cpp',
            'server',
            'foobar2000',
            config.buildType);

        config.pluginFile = 'foo_beefweb.dll';
    }

    createController(config)
    {
        return new PlayerController(config);
    }
}

export default TestContext;
