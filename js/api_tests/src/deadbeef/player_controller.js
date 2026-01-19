import path from 'path';
import fsObj from 'fs';
import os from 'os';
import mkdirp from 'mkdirp';
import {
    appsDir,
    callBySystem,
    execFile,
    installFiles, prepareProfileDir,
    rimraf,
    sharedLibraryExt,
    spawnProcess,
    writePluginSettings,
} from '../utils.js';
import { getDefaultAppVersion } from '../app_defs.js';

const fs = fsObj.promises;

const isMacOs = os.type() === 'Darwin';

const pluginFiles = [
    `beefweb.${sharedLibraryExt}`,
    `nullout2.${sharedLibraryExt}`
];

if (!isMacOs)
{
    pluginFiles.push(`ddb_gui_dummy.${sharedLibraryExt}`,)
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
        if (!this.process)
            return;

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
        finally
        {
            this.process = null;
        }
    }
}

export default PlayerController;
