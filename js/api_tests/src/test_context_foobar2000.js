import path from 'path';
import { getDefaultAppVersion } from './app_defs.js';
import { PlayerId, TestContextFactory } from './test_context.js';
import {
    appsDir,
    callBySystem,
    execFile,
    installFile,
    prepareProfileDir,
    replaceDirectory,
    restoreProfileDir,
    selectBySystem,
    spawnProcess,
    testsRootDir,
    waitForExit,
    writePluginSettings,
    isMacOs,
} from './utils.js';

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

        const version = process.env.BEEFWEB_TEST_FOOBAR2000_VERSION || await getDefaultAppVersion('foobar2000');
        const playerDir = path.join(appsDir, 'foobar2000', version);

        callBySystem(this, {
            windows()
            {
                this.command = path.join(playerDir, 'foobar2000.exe');
                this.profileDir = path.join(playerDir, 'profile');
                this.templateProfileDir = path.join(
                    testsRootDir,
                    'profile_data',
                    'foobar2000',
                    version.startsWith('v1.') ? 'windows-v1' : 'windows-v2');

                this.pluginDir = path.join(
                    this.profileDir,
                    version.endsWith('-x64') ? 'user-components-x64' : 'user-components',
                    'foo_beefweb');

                this.pluginFile = 'foo_beefweb.dll';
            },

            mac()
            {
                const { HOME } = process.env;

                this.command = path.join(playerDir, 'foobar2000.app');
                this.profileDir = path.join(HOME, 'Library/foobar2000-v2');
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

        await callBySystem(this, {
            windows()
            {
                return replaceDirectory(this.templateProfileDir, this.profileDir);
            },

            mac()
            {
                return prepareProfileDir(this.profileDir);
            }
        })

        await writePluginSettings(this.profileDir, options.pluginSettings);
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
        if (this.process)
            await this.stopProcess();

        if (isMacOs)
            await restoreProfileDir(this.profileDir);
    }

    async stopProcess()
    {
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
        catch(e)
        {
            console.error(e);
        }

        this.process = null;
    }
}

export class Foobar2000TestContextFactory extends TestContextFactory
{
    constructor()
    {
        super();
        this.playerId = PlayerId.foobar2000;
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
