import path from 'path';
import fsObj from 'fs';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import rimrafWithCallback from 'rimraf';
import tmp from 'tmp';
import {
    callBySystem,
    execFile,
    installFiles,
    sharedLibraryExt,
    spawnProcess,
    waitForExit,
    writePluginSettings,
} from '../utils.js';

const fs = fsObj.promises;
const rimraf = promisify(rimrafWithCallback)
const tmpdir = promisify(tmp.dir);

const defaultVersion = 'v1.10';

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
        this.pluginBuildDir = path.join(
            this.config.binaryDir,
            'cpp',
            'server',
            'deadbeef'
        );

        this.command = null;
        this.homeDir = null;
        this.profileDir = null;
        this.pluginDir = null;

        await callBySystem(this, {
            async posix() {
                const { BEEFWEB_TEST_DEADBEEF_VERSION: versionEnv } = process.env;

                const version = versionEnv || defaultVersion;
                const playerDir = path.join(this.config.appsDir, 'deadbeef', version);
                const homeDir = await tmpdir({ prefix: 'beefweb-api-tests' });

                this.command = path.join(playerDir, 'deadbeef');
                this.homeDir = homeDir;
                this.profileDir = path.join(homeDir, '.config/deadbeef');
                this.pluginDir = path.join(homeDir, '.local/lib/deadbeef');
            },

            async mac() {
                const { HOME } = process.env;

                this.command = '/Applications/DeaDBeeF.app';
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

        await installFiles(this.pluginBuildDir, this.pluginDir, pluginFiles);
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
                        await waitForExit(this.process);
                    },
                });
            }
            finally
            {
                this.process = null;
            }
        }

        if (this.homeDir)
        {
            await rimraf(this.homeDir);
        }
    }
}

export default PlayerController;
