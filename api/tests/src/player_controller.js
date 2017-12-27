'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');
const tmp = require('tmp');

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

const rootPath = path.dirname(path.dirname(path.dirname(__dirname)));
const pluginFiles = ['beefweb.so', 'ddb_gui_dummy.so'];

async function getBinaryArch(path)
{
    const { stdout } = await execFile('file', ['-L', path]);

    if (stdout.indexOf('x86-64') !== 0)
        return 'x86_64';

    if (stdout.indexOf('Intel 80386') !== 0)
        return 'x86';

    throw Error(`Unsupported file type: ${stdout}`);
}

class PlayerController
{
    constructor(config)
    {
        const pluginBuildDir = path.join(
            rootPath, 'server/build', config.buildType, 'src/plugin_deadbeef');

        this.paths = { pluginBuildDir };
        this.config = config;
    }

    async start()
    {
        if (!this.pluginArch)
            await this.detectPluginArch();

        if (!this.paths.playerBinary)
            await this.findPlayerBinary();

        if (!this.paths.profileDir)
            await this.initProfile();

        await this.writePlayerConfig();
        await this.installPlugins();
        await this.startProcess();
    }

    async stop()
    {
        this.stopProcess();
        await this.cleanUpProfile();
    }

    async getLog()
    {
        if (this.paths.logFile)
            return await readFile(this.paths.logFile, 'utf8');

        return null;
    }

    async detectPluginArch()
    {
        this.pluginArch = await getBinaryArch(
            path.join(this.paths.pluginBuildDir, pluginFiles[0]));
    }

    async findPlayerBinary()
    {
        const locations = [
            path.join(rootPath, `tools/deadbeef.${this.pluginArch}/deadbeef`),
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
        const settings = {
            'gui_plugin': 'dummy',
            'output_plugin': 'Null output plugin',
            'beefweb.allow_remote': 0,
            'beefweb.music_dirs': '',
            'beefweb.port': this.config.port,
        };

        await mkdirp(this.paths.configDir);
        await writeFile(this.paths.configFile, this.generatePlayerConfig(settings));
    }

    generatePlayerConfig(settings)
    {
        return Object
            .getOwnPropertyNames(settings)
            .map(key => `${key} ${settings[key]}\n`)
            .join('');
    }

    async installPlugins()
    {
        await mkdirp(this.paths.libDir);

        for (let name of pluginFiles)
        {
            await symlink(
                path.join(this.paths.pluginBuildDir, name),
                path.join(this.paths.libDir, name));
        }
    }

    async cleanUpProfile()
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

        this.process.unref();

        await close(logFile);
    }

    stopProcess()
    {
        if (this.process)
            this.process.kill();
    }
}

module.exports = PlayerController;
