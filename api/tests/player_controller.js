'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const tmp = require('tmp');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const pluginFileName = 'beefweb.so'
const rootPath = path.dirname(path.dirname(__dirname));

class PlayerController
{
    start()
    {
        this.paths = {};

        this.initConfig();
        this.findPlayerBinary();
        this.initProfile();
        this.writePlayerConfig();
        this.installPlugin();
        this.startProcess();
    }

    stop()
    {
        this.stopProcess();
        this.cleanUpProfile();
    }

    initConfig()
    {
        const { API_TESTS_BUILD_TYPE, API_TESTS_PORT } = process.env;

        this.config = {
            buildType: API_TESTS_BUILD_TYPE  || 'debug',
            port: parseInt(API_TESTS_PORT) || 8879,
        };
    }

    findPlayerBinary()
    {
        const prefixes = [
            path.join(rootPath, 'tools/deadbeef'),
            '/opt/deadbeef',
            '/usr/local',
            '/usr'
        ];

        for (let prefix of prefixes)
        {
            const fullPath = path.join(prefix, 'bin/deadbeef');

            try
            {
                fs.accessSync(fullPath, fs.constants.X_OK);
                this.paths.playerBinary = fullPath;
                return;
            }
            catch(e)
            {
            }
        }

        throw Error('Unable to find deadbeef executable');
    }

    initProfile()
    {
        const profileDir = tmp.dirSync({ prefix: 'api-tests-' }).name;
        const configDir = path.join(profileDir, '.config/deadbeef');
        const libDir = path.join(profileDir, '.local/lib/deadbeef');
        const configFile = path.join(configDir, 'config');

        const pluginFile = path.join(
            rootPath,
            'server/build',
            this.config.buildType,
            'src/plugin_deadbeef',
            pluginFileName);

        const installedPluginFile = path.join(libDir, pluginFileName);

        Object.assign(this.paths, {
            profileDir,
            configDir,
            configFile,
            libDir,
            pluginFile,
            installedPluginFile,
        });
    }

    writePlayerConfig()
    {
        const settings = {
            'output_plugin': 'Null output plugin',
            'beefweb.allow_remote': 0,
            'beefweb.music_dirs': '',
            'beefweb.port': this.config.port,
        };

        mkdirp.sync(this.paths.configDir);
        fs.writeFileSync(this.paths.configFile, this.generatePlayerConfig(settings));
    }

    generatePlayerConfig(settings)
    {
        let data = '';

        for (let key of Object.getOwnPropertyNames(settings))
            data += `${key} ${settings[key]}\n`;

        return data;
    }

    installPlugin()
    {
        mkdirp.sync(this.paths.libDir);
        fs.symlinkSync(this.paths.pluginFile, this.paths.installedPluginFile);
    }

    cleanUpProfile()
    {
        if (this.paths.profileDir)
            rimraf.sync(this.paths.profileDir);
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