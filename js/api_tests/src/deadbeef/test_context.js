import path from 'path';
import { TestContextFactory } from '../test_context.js';
import PlayerController from './player_controller.js';

export class DeadbeefTestContextFactory extends TestContextFactory
{
    createConfig()
    {
        const config = super.createConfig();

        config.playerId = 'deadbeef';

        const { BEEFWEB_TEST_DEADBEEF_VERSION } = process.env;
        const version = BEEFWEB_TEST_DEADBEEF_VERSION || 'v1.9';

        config.playerDirBase = path.join(config.appsDir, 'deadbeef', version);

        config.pluginBuildDir = path.join(
            config.rootDir,
            'build',
            config.buildType,
            'cpp',
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

        return config;
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
