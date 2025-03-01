import path from 'path'
import { fileURLToPath } from 'url'
import { getBinaryDir } from '../../config.mjs';
import RequestHandler from './request_handler.js';
import TestPlayerClient from './test_player_client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TestContext
{
    constructor(config, player, client, tracks, outputConfigs)
    {
        this.config = config;
        this.player = player;
        this.client = client;
        this.tracks = tracks;
        this.outputConfigs = outputConfigs;
        this.options = null;
    }

    async beginSuite(options = {})
    {
        const pluginSettings = Object.assign({}, this.config.pluginSettings, options.pluginSettings);

        const resetOptions = Object.assign(
            {
                playerState: true,
                playQueue: true,
                playlists: true,
                output: true,
                outputConfigs: this.outputConfigs
            },
            options.resetOptions);

        const axiosConfig = options.axiosConfig || null;
        const environment = options.environment || null;

        this.options = options = {
            pluginSettings,
            resetOptions,
            axiosConfig,
            environment
        };

        await this.player.start(options);

        this.client.handler.init(axiosConfig);

        if (await this.client.waitUntilReady())
            return;

        const logData = await this.player.getLog();

        if (logData)
            console.error('Player run log:\n%s', logData);

        throw Error('Failed to reach API endpoint');
    }

    async endSuite()
    {
        this.options = null;
        await this.player.stop();
    }

    async beginTest()
    {
        this.client.handler.init(this.options.axiosConfig);
        await this.client.resetState(this.options.resetOptions);
    }

    endTest()
    {
        this.client.handler.shutdown();
    }
}

export class TestContextFactory
{
    createContext()
    {
        const config = Object.freeze(this.createConfig());
        const tracks = Object.freeze(this.createTracks(config));
        const outputConfigs = Object.freeze(this.createOutputConfigs());
        const player = this.createPlayer(config);
        const client = this.createClient(config);
        return new TestContext(config, player, client, tracks, outputConfigs);
    }

    createConfig()
    {
        const { BEEFWEB_TEST_BUILD_TYPE, BEEFWEB_TEST_PORT } = process.env;

        const testsRootDir = path.dirname(__dirname);
        const rootDir = path.dirname(path.dirname(testsRootDir));
        const buildType = BEEFWEB_TEST_BUILD_TYPE || 'Debug';
        const binaryDir = getBinaryDir(buildType);
        const port = parseInt(BEEFWEB_TEST_PORT) || 8879;
        const serverUrl = `http://127.0.0.1:${port}`;

        const appsDir = path.join(rootDir, 'apps');
        const webRootDir = path.join(testsRootDir, 'webroot');
        const musicDir = path.join(testsRootDir, 'tracks');

        const pluginSettings = {
            port,
            allowRemote: false,
            musicDirs: [musicDir],
            webRoot: webRootDir,
        };

        return {
            buildType,
            port,
            serverUrl,
            rootDir,
            binaryDir,
            testsRootDir,
            appsDir,
            webRootDir,
            musicDir,
            pluginSettings,
        };
    }

    createTracks(config)
    {
        const { musicDir } = config;

        return {
            t1: path.join(musicDir, 'track1.flac'),
            t2: path.join(musicDir, 'track2.flac'),
            t2Alt: path.join(musicDir, 'subdir', 'track2.flac'),
            t3: path.join(musicDir, 'subdir', 'track3.flac'),
            emptyDir: path.join(musicDir, 'empty'),
        }
    }

    createOutputConfigs()
    {
        return {
            default: { typeId: 'output', deviceId: 'default' },
            alternate: [
                { typeId: 'output', deviceId: 'other_device' }
            ],
        }
    }

    createClient(config)
    {
        return new TestPlayerClient(new RequestHandler(config.serverUrl));
    }

    createPlayer(config)
    {
        throw new Error('createPlayer() is not implemented');
    }
}
