'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');
const tmp = require('tmp');

const accessCheck = promisify(fs.access);
const writeFile = promisify(fs.writeFile);
const symlink = promisify(fs.symlink);

const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));

const rootPath = path.dirname(path.dirname(path.dirname(__dirname)));
const pluginFiles = ['beefweb.so', 'ddb_gui_dummy.so'];

function tmpDir(args)
{
    return new Promise((resolve, reject) => {
        tmp.dir(args, (err, path) => {
            if (err)
                reject(err);
            else
                resolve(path);
        });
    });
}

class PlayerController
{
    constructor(config)
    {
        this.paths = {};
        this.config = config;
    }

    async start()
    {
        if (!this.paths.playerBinary)
            await this.findPlayerBinary();

        if (!this.paths.profileDir)
            await this.initProfile();

        await this.writePlayerConfig();
        await this.installPlugins();

        this.startProcess();
    }

    async stop()
    {
        this.stopProcess();
        await this.cleanUpProfile();
    }

    async findPlayerBinary()
    {
        const locations = [
            path.join(rootPath, 'tools/deadbeef/deadbeef'),
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
                return;
            }
            catch(e)
            {
            }
        }

        throw Error('Unable to find deadbeef executable');
    }

    async initProfile()
    {
        const profileDir = await tmpDir({ prefix: 'api-tests-' });
        const configDir = path.join(profileDir, '.config/deadbeef');
        const libDir = path.join(profileDir, '.local/lib/deadbeef');
        const configFile = path.join(configDir, 'config');

        const pluginBuildDir = path.join(
            rootPath, 'server/build', this.config.buildType, 'src/plugin_deadbeef');

        Object.assign(this.paths, {
            profileDir,
            configDir,
            configFile,
            libDir,
            pluginBuildDir,
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

    startProcess()
    {
        const env = Object.assign({}, process.env, { HOME: this.paths.profileDir });

        this.process = childProcess.spawn(this.paths.playerBinary, [], {
            cwd: this.paths.profileDir,
            env,
            stdio: 'ignore',
            detached: true,
        });

        this.process.unref();
    }

    stopProcess()
    {
        if (this.process)
            this.process.kill();
    }
}

module.exports = PlayerController;
