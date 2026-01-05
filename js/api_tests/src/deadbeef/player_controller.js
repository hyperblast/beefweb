import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import rimrafWithCallback from 'rimraf';
import tmp from 'tmp';

const accessCheck = promisify(fs.access);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const symlink = promisify(fs.symlink);
const open = promisify(fs.open);
const close = promisify(fs.close);
const rimraf = promisify(rimrafWithCallback)
const tmpdir = promisify(tmp.dir);

class PlayerController
{
    constructor(config)
    {
        this.config = config;
        this.paths = {};
    }

    async start(options)
    {
        const { pluginSettings, environment } = options;

        if (!this.paths.playerBinary)
            await this.findPlayerBinary();

        if (!this.paths.profileDir)
            await this.initProfile();

        await this.installPlugins();
        await this.writePlayerSettings();
        await this.writePluginSettings(pluginSettings);
        await this.startProcess(environment);
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

    async findPlayerBinary()
    {
        const locations = [
            path.join(this.config.playerDirBase, 'deadbeef'),
            '/opt/deadbeef/bin/deadbeef',
            '/usr/local/bin/deadbeef',
            '/usr/bin/deadbeef'
        ];

        for (let location of locations)
        {
            try
            {
                await accessCheck(location, fs.constants.X_OK);
                this.paths.playerBinary = location;
                console.log('using deadbeef at ' + this.paths.playerBinary);
                return;
            }
            catch(e)
            {
            }
        }

        throw new Error(`Unable to find deadbeef executable`);
    }

    async initProfile()
    {
        const userProfileDir = await tmpdir({ prefix: 'beefweb-api-tests-' });
        const profileDir = path.join(userProfileDir, '.config/deadbeef');
        const libDir = path.join(userProfileDir, '.local/lib/deadbeef');
        const logFile = path.join(userProfileDir, 'run.log');

        Object.assign(this.paths, {
            userProfileDir,
            profileDir,
            libDir,
            logFile,
        });
    }

    async writePlayerSettings()
    {
        const settings = this.config.deadbeefSettings;

        const data = Object
            .keys(settings)
            .map(key => `${key} ${settings[key]}\n`)
            .join('');

        await mkdirp(this.paths.profileDir);
        await writeFile(path.join(this.paths.profileDir, 'config'), data);
    }

    async writePluginSettings(settings)
    {
        const pluginConfigDir = path.join(this.paths.profileDir, 'beefweb');
    
        await mkdirp(path.join(pluginConfigDir, 'clientconfig'));

        await writeFile(
            path.join(pluginConfigDir, 'config.json'),
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
        if (this.paths.userProfileDir)
            await rimraf(this.paths.userProfileDir);
    }

    async startProcess(environment)
    {
        const env = Object.assign(
            {},
            process.env,
            {
                HOME: this.paths.userProfileDir,
                XDG_CONFIG_HOME: path.join(this.paths.userProfileDir, '.config')
            },
            environment);

        const logFile = await open(this.paths.logFile, 'w');

        this.process = childProcess.spawn(this.paths.playerBinary, [], {
            cwd: this.paths.userProfileDir,
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

export default PlayerController;
