'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');
const { waitForExit } = require('../utils');

const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const execFile = promisify(childProcess.execFile);

class PlayerController
{
    constructor(config)
    {
        this.config = config;
        this.pluginInstalled = false;
        this.paths = Object.freeze({
            exeFile: path.join(config.playerDir, 'foobar2000.exe'),
            componentsDir: path.join(config.playerDir, 'components'),
        });
    }

    async start(options)
    {
        const { pluginSettings, environment } = options;

        if (!this.pluginInstalled)
            await this.installPlugin();

        await this.writePluginSettings(pluginSettings);
        this.startProcess(environment);
    }

    async stop()
    {
        await this.stopProcess();
    }

    getLog()
    {
        return null;
    }

    async installPlugin()
    {
        await copyFile(
            path.join(this.config.pluginBuildDir, this.config.pluginFile),
            path.join(this.paths.componentsDir, this.config.pluginFile));

        this.pluginInstalled = true;
    }

    async writePluginSettings(settings)
    {
        await writeFile(
            path.join(this.paths.componentsDir, 'beefweb.config.json'),
            JSON.stringify(settings));
    }

    startProcess(environment)
    {
        if (this.process)
            throw new Error('Process is still running');

        this.process = childProcess.spawn(this.paths.exeFile, ['/hide'], {
            cwd: this.config.playerDir,
            detached: true,
            env: Object.assign({}, process.env, environment)
        });

        this.process.on('error', err => console.error('Error spawning player process: %s', err));
        this.process.on('exit', () => this.process = null);
        this.process.unref();
    }

    async stopProcess()
    {
        const process = this.process;

        if (!process)
            return;

        await execFile(this.paths.exeFile, ['/exit']);
        if (await waitForExit(process, 3000))
            return;

        console.error('Failed to cleanly stop player, terminating process');
        process.kill();
        await waitForExit(process);
    }
}

module.exports = PlayerController;
