'use strict';

const path = require('path');
const RequestHandler = require('./request_handler');
const TestApiClient = require('./test_api_client');
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
        const serverUrl = `http://localhost:${port}`;

        const toolsDir = path.join(rootDir, 'tools');
        const webRootDir = path.join(testsRootDir, 'webroot');
        const musicDir = path.join(testsRootDir, 'tracks');

        const pluginBuildDir = path.join(
            rootDir, 'server/build', buildType, 'src/player_deadbeef');

        const pluginFiles = [
            'beefweb.so',
            'ddb_gui_dummy.so',
            'nullout2.so'
        ];

        this.config = Object.freeze({
            buildType,
            port,
            serverUrl,
            rootDir,
            testsRootDir,
            toolsDir,
            webRootDir,
            musicDir,
            pluginBuildDir,
            pluginFiles,
        });

        this.playerSettings = Object.freeze({
            'gui_plugin': 'dummy',
            'output_plugin': 'Null output plugin v2',
            'beefweb.allow_remote': 0,
            'beefweb.music_dirs': musicDir,
            'beefweb.port': port,
        });

        this.client = new TestApiClient(new RequestHandler(serverUrl));
        this.player = new PlayerController(this.config);

        this.tracks = Object.freeze({
            t1: path.join(musicDir, 'track1.flac'),
            t2: path.join(musicDir, 'track2.flac'),
            t3: path.join(musicDir, 'subdir/track3.flac'),
        });

        this.usePlayer = this.usePlayer.bind(this);
    }

    usePlayer(options)
    {
        let playerSettings = this.playerSettings;
        let axiosConfig = null;

        if (options)
        {
            if (options.playerSettings)
            {
                playerSettings = Object.assign(
                    {}, this.playerSettings, options.playerSettings);
            }

            if (options.axiosConfig)
                axiosConfig = options.axiosConfig;
        }

        return {
            before: () => this.beginModule(playerSettings, axiosConfig),
            after: () => this.endModule(),
            beforeEach: () => this.beginTest(axiosConfig),
            afterEach: () => this.endTest(),
        };
    }

    async beginModule(playerSettings, axiosConfig)
    {
        await this.player.start(playerSettings);

        this.client.handler.init(axiosConfig);

        if (await this.client.waitUntilReady())
            return;

        const logData = await this.player.getLog();
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
}

module.exports = new TestContext();
