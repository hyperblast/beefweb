import path from 'path';
import {
    callBySystem,
    execFile,
    installFile, selectBySystem,
    spawnProcess,
    waitForExit,
    writePluginSettings,
} from '../utils.js';

const defaultVersion = 'v2.24-x64';

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

        await callBySystem(this, {
            async windows()
            {
                const { BEEFWEB_TEST_FOOBAR2000_VERSION: versionEnv } = process.env;

                const version = versionEnv || defaultVersion;
                const playerDir = path.join(this.config.appsDir, 'foobar2000', version);
                const profileDir = version.startsWith('v1.') ? playerDir : path.join(playerDir, 'profile');
                const componentsDir = version.endsWith('-x64') ? 'user-components-x64' : 'user-components';

                this.command = path.join(playerDir, 'foobar2000.exe');
                this.profileDir = profileDir;

                await installFile(
                    this.config.pluginBuildDir,
                    path.join(profileDir, componentsDir, 'foo_beefweb'),
                    'foo_beefweb.dll');
            },

            async mac()
            {
                const { HOME } = process.env;

                this.command = '/Applications/foobar2000.app';
                this.profileDir = `${HOME}/Library/foobar2000-v2`;

                await installFile(
                    this.config.pluginBuildDir,
                    path.join(this.profileDir, 'user-components', 'foo_beefweb'),
                    'foo_beefweb.component');
            }
        });

        this.logFile = path.join(this.profileDir, 'api_tests.log');
    }

    async start(options)
    {
        if (this.process)
            throw new Error('Process is still running');

        await writePluginSettings(this.profileDir, options.pluginSettings);

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
