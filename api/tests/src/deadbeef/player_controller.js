'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');

const accessCheck = promisify(fs.access);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const symlink = promisify(fs.symlink);
const open = promisify(fs.open);
const close = promisify(fs.close);

const execFile = promisify(childProcess.execFile);

const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));
const tmpdir = promisify(require('tmp').dir);

async function getBinaryArch(path)
{
    const { stdout } = await execFile('file', ['-L', path]);

    if (stdout.indexOf('x86-64') !== -1)
        return 'x86_64';

    if (stdout.indexOf('Intel 80386') !== -1)
        return 'x86';

    throw Error(`Unsupported file type: ${stdout}`);
}

class PlayerController
{
    constructor(config)
    {
        this.config = config;
        this.paths = {};
    }

    async start(settings)
    {
        if (!this.pluginArch)
            await this.detectPluginArch();

        if (!this.paths.playerBinary)
            await this.findPlayerBinary();

        if (!this.paths.profileDir)
            await this.initProfile();

        await this.installPlugins();
        await this.writePlayerConfig();
        await this.writePluginConfig(settings);
        await this.startProcess();
    }

    async stop()
    {
        this.stopProcess();
        await this.removeTempFiles();
    }

    async getLog()
    {
        if (this.paths.logFile)
            return await readFile(this.paths.logFile, 'utf8');

        return null;
    }

    async detectPluginArch()
    {
        const pluginPath = path.join(
            this.config.pluginBuildDir,
            this.config.pluginFiles[0]);

        this.pluginArch = await getBinaryArch(pluginPath);
    }

    async findPlayerBinary()
    {
        const locations = [
            path.join(this.config.toolsDir, `deadbeef.${this.pluginArch}/deadbeef`),
            '/opt/deadbeef/bin/deadbeef',
            '/usr/local/bin/deadbeef',
            '/usr/bin/deadbeef'
        ];

        for (let location of locations)
        {
            try
            {
                await accessCheck(location, fs.constants.X_OK);

                const binaryArch = await getBinaryArch(location);

                if (binaryArch !== this.pluginArch)
                    continue;

                this.paths.playerBinary = location;
                return;
            }
            catch(e)
            {
            }
        }

        throw Error(`Unable to find deadbeef ${this.pluginArch} executable`);
    }

    async initProfile()
    {
        const profileDir = await tmpdir({ prefix: 'api-tests-' });
        const configDir = path.join(profileDir, '.config/deadbeef');
        const libDir = path.join(profileDir, '.local/lib/deadbeef');
        const configFile = path.join(configDir, 'config');
        const logFile = path.join(profileDir, 'run.log');

        Object.assign(this.paths, {
            profileDir,
            configDir,
            configFile,
            libDir,
            logFile,
        });
    }

    async writePlayerConfig()
    {
        const settings = this.config.deadbeefSettings;

        const data = Object
            .keys(settings)
            .map(key => `${key} ${settings[key]}\n`)
            .join('');

        await mkdirp(this.paths.configDir);
        await writeFile(this.paths.configFile, data);
    }

    async writePluginConfig(settings)
    {
        await mkdirp(this.paths.libDir);

        await writeFile(
            path.join(this.paths.libDir, 'beefweb.config.json'),
            JSON.stringify(settings));
    }

    async installPlugins()
    {
        await mkdirp(this.paths.libDir);

        for (let name of this.config.pluginFiles)
        {
            await symlink(
                path.join(this.config.pluginBuildDir, name),
                path.join(this.paths.libDir, name));
        }
    }

    async removeTempFiles()
    {
        if (this.paths.profileDir)
            await rimraf(this.paths.profileDir);
    }

    async startProcess()
    {
        const env = Object.assign({}, process.env, { HOME: this.paths.profileDir });

        const logFile = await open(this.paths.logFile, 'w');

        this.process = childProcess.spawn(this.paths.playerBinary, [], {
            cwd: this.paths.profileDir,
            env,
            stdio: ['ignore', logFile, logFile],
            detached: true,
        });

        this.process.on('error', err => console.error('Error spawning player process: %s', err));
        this.process.on('exit', () => this.process = null);
        this.process.unref();

        await close(logFile);
    }

    stopProcess()
    {
        if (!this.process)
            return;

        this.process.kill();
        this.process = null;
    }
}

module.exports = PlayerController;
