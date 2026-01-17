import path from 'path';
import childProcess from 'child_process';
import { installFile, spawnProcess, waitForExit, writePluginSettings } from '../utils.js';
import { promisify } from 'util';

const execFile = promisify(childProcess.execFile);

const defaultVersion = 'v2.24-x64';

class PlayerController
{
    constructor(config)
    {
        this.config = config;
    }

    async setup()
    {
        const { BEEFWEB_TEST_FOOBAR2000_VERSION: versionEnv } = process.env;

        const version = versionEnv || defaultVersion;
        const playerDir = path.join(config.appsDir, 'foobar2000', version);
        const profileDir = version.startsWith('v1.')
            ? playerDir
            : path.join(playerDir, 'profile');

        const pluginBuildDir = path.join(
            this.config.binaryDir,
            'cpp',
            'server',
            'foobar2000',
            this.config.buildType);

        this.exeFile = path.join(playerDir, 'foobar2000.exe');
        this.profileDir = profileDir;

        await installFile(
            pluginBuildDir,
            path.join(profileDir, 'user-components', 'foo_beefweb'),
            'foobar2000.dll');
    }

    async start(options)
    {
        if (this.process)
            throw new Error('Process is still running');

        await writePluginSettings(this.profileDir, options.pluginSettings);

        this.process = spawnProcess({
            command: this.exeFile,
            args: ['/hide'],
            cwd: this.profileDir,
            onExit: () => this.process = null,
        });
    }

    async stop()
    {
        const { process, exeFile } = this;

        if (!process)
            return;

        await execFile(exeFile, ['/exit']);
        if (await waitForExit(process, 3000))
            return;

        console.error('Failed to cleanly stop player, terminating process');
        process.kill();
        await waitForExit(process);
    }

    getLog()
    {
        return null;
    }
}

export default PlayerController;
