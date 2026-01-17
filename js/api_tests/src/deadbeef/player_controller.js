import path from 'path';
import fsObj from 'fs';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import rimrafWithCallback from 'rimraf';
import tmp from 'tmp';
import { installFiles, spawnProcess, writePluginSettings } from '../utils.js';

const fs = fsObj.promises;
const rimraf = promisify(rimrafWithCallback)
const tmpdir = promisify(tmp.dir);

const defaultVersion = 'v1.10';

const pluginFiles = [
    'beefweb.so',
    'ddb_gui_dummy.so',
    'nullout2.so'
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
        const { BEEFWEB_TEST_DEADBEEF_VERSION: versionEnv } = process.env;

        const version = versionEnv || defaultVersion;
        const playerDir = path.join(this.config.appsDir, 'deadbeef', version);
        const homeDir = await tmpdir({ prefix: 'beefweb-api-tests' });

        this.pluginBuildDir = path.join(
            this.config.binaryDir,
            'cpp',
            'server',
            'deadbeef'
        );

        this.exeFile = path.join(playerDir, 'deadbeef');
        this.homeDir = homeDir;
        this.profileDir = path.join(homeDir, '.config/deadbeef');
        this.pluginDir = path.join(homeDir, '.local/lib/deadbeef');
        this.logFile = path.join(homeDir, 'run.log');
    }

    async start(options)
    {
        if (this.process)
            throw new Error('Process is still running');

        await installFiles(this.pluginBuildDir, this.pluginDir, pluginFiles);
        await writePlayerSettings(this.profileDir);
        await writePluginSettings(this.profileDir, options.pluginSettings);

        const env = {
            ...process.env,
            HOME: this.homeDir,
            XDG_CONFIG_HOME: path.join(this.homeDir, '.config')
        };

        const logFileHandle = await fs.open(this.logFile, 'w');

        this.process = spawnProcess({
            command: this.exeFile,
            cwd: this.homeDir,
            env,
            stdio: ['ignore', logFileHandle, logFileHandle],
            onExit: () => this.process = null,
        });

        await logFileHandle.close();
    }

    async stop()
    {
        if (this.process)
        {
            this.process.kill();
            this.process = null;
        }

        await rimraf(this.homeDir);
    }

    async getLog()
    {
        return await readFile(this.logFile, 'utf8');
    }
}

export default PlayerController;
