import path from 'path';
import {
    callBySystem,
    execFile,
    installFile,
    rimraf,
    selectBySystem,
    spawnProcess,
    waitForExit,
    writePluginSettings,
} from '../utils.js';
import { getDefaultAppVersion } from '../app_defs.js';
import { PlayerId } from '../test_context.js';

class PlayerController
{
    constructor(config)
    {
        this.config = config;
    }

    async setup()
    {
        this.command = null;
        this.profileDir = null;
        this.templateProfileDir = null;
        this.pluginDir = null;
        this.pluginFile = null;

        await callBySystem(this, {
            async windows()
            {
                const { BEEFWEB_TEST_FOOBAR2000_VERSION: versionEnv } = process.env;

                const version = versionEnv || await getDefaultAppVersion(PlayerId.foobar2000);
                const playerDir = path.join(this.config.appsDir, 'foobar2000', version);
                const profileDir = path.join(playerDir, 'profile');

                this.command = path.join(playerDir, 'foobar2000.exe');
                this.profileDir = profileDir;
                this.templateProfileDir = path.join(
                    this.config.testsRootDir,
                    'profile_data',
                    'foobar2000',
                    version.startsWith('v1.') ? 'windows-v1' : 'windows-v2');

                this.pluginDir = path.join(
                    profileDir,
                    version.endsWith('-x64') ? 'user-components-x64' : 'user-components',
                    'foo_beefweb');

                this.pluginFile = 'foo_beefweb.dll';
            },

            async mac()
            {
                const { HOME } = process.env;

                this.command = '/Applications/foobar2000.app';
                this.profileDir = `${HOME}/Library/foobar2000-v2`;
                this.pluginDir = path.join(this.profileDir, 'user-components', 'foo_beefweb');
                this.pluginFile = 'foo_beefweb.component';
            }
        });

        this.logFile = path.join(this.profileDir, 'api_tests.log');
    }

    async start(options)
    {
        if (this.process)
            throw new Error('Process is still running');

        await rimraf(this.profileDir);

        await writePluginSettings(this.profileDir, options.pluginSettings);

        await callBySystem(this, {
            async windows()
            {
                await execFile('xcopy.exe', ['/S', this.templateProfileDir, this.profileDir]);
            },

            async mac()
            {
                // TODO
            }
        });

        await installFile(this.config.pluginBuildDir, this.pluginDir, this.pluginFile);

        this.process = await spawnProcess({
            command: this.command,
            cwd: this.profileDir,
            logFile: this.logFile,
            args: selectBySystem({
                windows: ['/hide'],
                mac: []
            }),
            onExit: () => this.process = null,
        });
    }

    async stop()
    {
        if (!this.process)
            return;

        try
        {
            await callBySystem(this, {
                async windows()
                {
                    await execFile(this.command, ['/exit']);

                    if (await waitForExit(this.process, 3000))
                        return;

                    console.error('Failed to cleanly stop player, terminating process');
                    this.process.kill();
                },

                async mac()
                {
                    await execFile('killall', ['foobar2000']);
                }
            });
        }
        finally
        {
            this.process = null;
        }
    }
}

export default PlayerController;
