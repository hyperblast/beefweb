'use strict';

const path = require('path');
const RequestHandler = require('./request_handler');
const TestApiClient = require('./test_api_client');

class TestContextBase
{
    constructor()
    {
        const { BEEFWEB_TEST_BUILD_TYPE, BEEFWEB_TEST_PORT } = process.env;

        const testsRootDir = path.dirname(__dirname);
        const rootDir = path.dirname(path.dirname(testsRootDir));
        const buildType = BEEFWEB_TEST_BUILD_TYPE || 'debug';
        const port = parseInt(BEEFWEB_TEST_PORT) || 8879;
        const serverUrl = `http://localhost:${port}`;

        const toolsDir = path.join(rootDir, 'tools');
        const webRootDir = path.join(testsRootDir, 'webroot');
        const musicDir = path.join(testsRootDir, 'tracks');

        const pluginSettings = {
            port,
            allowRemote: false,
            musicDirs: [musicDir],
            staticDir: webRootDir,
        };

        const config = {
            buildType,
            port,
            serverUrl,
            rootDir,
            testsRootDir,
            toolsDir,
            webRootDir,
            musicDir,
            pluginSettings,
        };

        this.initConfig(config);
        this.config = Object.freeze(config);

        this.client = new TestApiClient(new RequestHandler(serverUrl));
        this.player = this.createController(config);

        this.tracks = Object.freeze({
            t1: path.join(musicDir, 'track1.flac'),
            t2: path.join(musicDir, 'track2.flac'),
            t3: path.join(musicDir, 'subdir', 'track3.flac'),
        });

        this.usePlayer = this.usePlayer.bind(this);
    }

    usePlayer(options = {})
    {
        const pluginSettings = Object.assign(
            {}, this.config.pluginSettings, options.pluginSettings);

        const axiosConfig = options.axiosConfig || null;

        return {
            before: () => this.beginModule(pluginSettings, axiosConfig),
            after: () => this.endModule(),
            beforeEach: () => this.beginTest(axiosConfig),
            afterEach: () => this.endTest(),
        };
    }

    async beginModule(pluginSettings, axiosConfig)
    {
        await this.player.start(pluginSettings);

        this.client.handler.init(axiosConfig);

        if (await this.client.waitUntilReady())
            return;

        const logData = await this.player.getLog();

        if (logData)
            console.error('Player run log:\n%s', logData);

        throw Error('Failed to reach API endpoint');
    }

    async endModule()
    {
        await this.player.stop();
    }

    async beginTest(axiosConfig)
    {
        this.client.handler.init(axiosConfig);
        await this.client.resetState();
    }

    endTest()
    {
        this.client.handler.shutdown();
    }

    initConfig(config)
    {
        throw new Error('initConfig() is not implemented');
    }

    createController(config)
    {
        throw new Error('createController() is not implemented');
    }
}

module.exports = TestContextBase;
