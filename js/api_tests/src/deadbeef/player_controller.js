import path from 'path';
import fsObj from 'fs';
import mkdirp from 'mkdirp';
import {
    appsDir,
    callBySystem,
    execFile,
    installFiles,
    rimraf,
    sharedLibraryExt,
    spawnProcess,
    writePluginSettings,
} from '../utils.js';
import { getAppVersion } from '../app_defs.js';
import { PlayerId } from '../test_context.js';

const fs = fsObj.promises;

const pluginFiles = [
    `beefweb.${sharedLibraryExt}`,
    `ddb_gui_dummy.${sharedLibraryExt}`,
    `nullout2.${sharedLibraryExt}`
];

async function writePlayerSettings(profileDir)
{
    await mkdirp(profileDir);

    await fs.writeFile(
        path.join(profileDir, 'config'),
        'gui_plugin dummy\n' +
        'output_plugin nullout2\n');
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

        const version = await getAppVersion(PlayerId.deadbeef, 'BEEFWEB_TEST_DEADBEEF_VERSION');
        const playerDir = path.join(appsDir, 'deadbeef', version);

        await callBySystem(this, {
            async posix()
            {
                const homeDir = path.join(playerDir, 'test_data');

                this.command = path.join(playerDir, 'deadbeef');
                this.homeDir = homeDir;
                this.profileDir = path.join(homeDir, '.config/deadbeef');
                this.pluginDir = path.join(homeDir, '.local/lib/deadbeef');
            },

            async mac()
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

        if (this.homeDir)
            await rimraf(this.homeDir);

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
