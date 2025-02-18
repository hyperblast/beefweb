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

    createOutputConfigs()
    {
        return {
            default: {
                // Null Output
                typeId: 'output',
                deviceId: 'EEEB07DE-C2C8-44C2-985C-C85856D96DA1:5243F9AD-C84F-4723-8194-0788FC021BCC'
            },

            alternate: [
                {
                    // Primary Sound Driver
                    typeId: 'output',
                    deviceId: 'D41D2423-FBB0-4635-B233-7054F79814AB:00000000-0000-0000-0000-000000000000'
                }
            ]
        }
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
