import path from 'path';
import { TestContextFactory } from '../test_context.js';
import PlayerController from './player_controller.js';

export class Foobar2000TestContextFactory extends TestContextFactory
{
    createConfig()
    {
        const config = super.createConfig();

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

        return config;
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
