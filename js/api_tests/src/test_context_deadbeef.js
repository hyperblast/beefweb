import path from 'path';
import fsObj from 'fs';
import mkdirp from 'mkdirp';
import { getDefaultAppVersion } from './app_defs.js';
import { PlayerId, TestContextFactory } from './test_context.js';
import {
    appsDir,
    callBySystem,
    execFile,
    installFiles,
    prepareProfileDir,
    restoreProfileDir,
    rimraf,
    sharedLibraryExt,
    spawnProcess,
    writePluginSettings,
    isMacOs,
    isLinux,
} from './utils.js';

const fs = fsObj.promises;

const pluginFiles = [
    `beefweb${sharedLibraryExt}`,
    `nullout2${sharedLibraryExt}`
];

if (!isMacOs)
{
    pluginFiles.push(`ddb_gui_dummy${sharedLibraryExt}`,)
}

async function writePlayerSettings(profileDir)
{
    await mkdirp(profileDir);
    const configData = 'output_plugin nullout2\n' + (isMacOs ? '' : 'gui_plugin dummy\n');
    await fs.writeFile(path.join(profileDir, 'config'), configData);
}

class PlayerController
{
    constructor(config)
    {
        this.config = config;
    }

    async setup()
    {
        this.command = null;
        this.homeDir = null;
        this.profileDir = null;
        this.pluginDir = null;

        const version = process.env.BEEFWEB_TEST_DEADBEEF_VERSION || await getDefaultAppVersion('deadbeef');
        const playerDir = path.join(appsDir, 'deadbeef', version);

        callBySystem(this, {
            posix()
            {
                const homeDir = path.join(playerDir, 'test_data');

                this.command = path.join(playerDir, 'deadbeef');
                this.homeDir = homeDir;
                this.profileDir = path.join(homeDir, '.config/deadbeef');
                this.pluginDir = path.join(homeDir, '.local/lib/deadbeef');
            },

            mac()
            {
                const { HOME } = process.env;

                this.command = path.join(playerDir, 'DeaDBeeF.app');
                this.profileDir = `${HOME}/Library/Preferences/deadbeef`
                this.pluginDir = `${HOME}/Library/Application Support/Deadbeef/Plugins`;
            },
        });

        this.logFile = path.join(this.profileDir, 'api_tests.log');
    }

    async start(options)
    {
        if (this.process)
            throw new Error('Process is still running');

        await callBySystem(this, {
            posix()
            {
                return rimraf(this.homeDir);
            },

            async mac()
            {
                await prepareProfileDir(this.profileDir);
                await prepareProfileDir(this.pluginDir);
            }
        })

        await installFiles(this.config.pluginBuildDir, this.pluginDir, pluginFiles);
        await writePlayerSettings(this.profileDir);
        await writePluginSettings(this.profileDir, options.pluginSettings);

        const env = !this.homeDir ? undefined : {
            ...process.env,
            HOME: this.homeDir,
            XDG_CONFIG_HOME: path.join(this.homeDir, '.config')
        };

        this.process = await spawnProcess({
            command: this.command,
            cwd: this.homeDir,
            env,
            logFile: this.logFile,
            onExit: () => this.process = null,
        });
    }

    async stop()
    {
        if (this.process)
            await this.stopProcess();

        if (isMacOs)
        {
            await restoreProfileDir(this.profileDir);
            await restoreProfileDir(this.pluginDir);
        }
    }

    async stopProcess()
    {
        try
        {
            await callBySystem(this, {
                async posix()
                {
                    this.process.kill();
                },

                async mac()
                {
                    await execFile('killall', ['DeaDBeeF']);
                },
            });
        }
        catch(e)
        {
            console.error(e);
        }

        this.process = null;
    }
}

export class DeadbeefTestContextFactory extends TestContextFactory
{
    constructor()
    {
        super();
        this.playerId = PlayerId.deadbeef;
    }

    createOutputConfigs()
    {
        const result = {
            default: { typeId: 'nullout2', deviceId: 'default' },
            alternate: [
                { typeId: 'nullout', deviceId: 'default' }
            ],
        };

        if (isLinux)
            result.alternate.push({ typeId: 'alsa', deviceId: 'null' });

        return result;
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}