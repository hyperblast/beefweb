'use strict';

const path = require('path');
const ApiClient = require('./api_client');
const PlayerController = require('./player_controller');

const testsRootDir = path.dirname(__dirname);
const rootDir = path.dirname(path.dirname(testsRootDir));

class TestContext
{
    constructor()
    {
        const { API_TESTS_BUILD_TYPE, API_TESTS_PORT } = process.env;

        const buildType = API_TESTS_BUILD_TYPE  || 'debug';
        const port = parseInt(API_TESTS_PORT) || 8879;

        const toolsDir = path.join(rootDir, 'tools');
        const webRootDir = path.join(testsRootDir, 'webroot');
        const musicDir = path.join(testsRootDir, 'tracks');

        const pluginBuildDir = path.join(
            rootDir, 'server/build', buildType, 'src/plugin_deadbeef');

        this.config = Object.freeze({
            buildType,
            port,
            rootDir,
            testsRootDir,
            toolsDir,
            webRootDir,
            musicDir,
            pluginBuildDir,
        });

        this.client = new ApiClient(`http://localhost:${port}`);
        this.player = new PlayerController(this.config);

        this.musicDir = musicDir;
        this.tracks = Object.freeze({
            t1: path.join(this.musicDir, 'track1.flac'),
            t2: path.join(this.musicDir, 'track2.flac'),
            t3: path.join(this.musicDir, 'subdir/track3.flac'),
        });

        this.moduleHooks = Object.freeze({
            before: this.beginModule.bind(this),
            after: this.endModule.bind(this),
            beforeEach: this.beginTest.bind(this),
        });
    }

    async beginModule()
    {
        await this.player.start();

        if (await this.client.waitUntilReady())
            return;

        const logData = await this.player.getLog();
        console.error('Player run log:\n%s', logData);
        throw Error('Failed to reach API endpoint');
    }

    async endModule()
    {
        this.client.cancelRequests();
        await this.player.stop();
    }

    async beginTest()
    {
        await this.client.resetState();
    }
}

module.exports = new TestContext();