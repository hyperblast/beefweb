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
        this.wantRestart = false;
    }

    initOptions(options)
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

        const { axiosConfig, environment } = options;

        this.options = {
            pluginSettings,
            resetOptions,
            axiosConfig,
            environment
        };
    }

    initClient()
    {
        this.client.handler.init(this.options.axiosConfig);
    }

    async startPlayer()
    {
        await this.player.start(this.options);

        if (await this.client.waitUntilReady())
        {
            return;
        }

        const logData = await this.player.getLog();

        if (logData)
            console.error('Player run log:\n%s', logData);

        throw Error('Failed to reach API endpoint');
    }
    
    async stopPlayer()
    {
        await this.player.stop();
    }

    async beginSuite(options = {}, reuseOptions = false)
    {
        this.wantRestart = false;
        this.initOptions(options);
        this.initClient();
        await this.startPlayer();
    }

    async endSuite()
    {
        this.options = null;
        await this.stopPlayer();
    }

    async beginTest()
    {
        if (this.wantRestart)
        {
            await this.stopPlayer();
            this.initClient();
            await this.startPlayer();
            this.wantRestart = false;
        }
        else
        {
            this.initClient();
        }

        try
        {
            await this.client.resetState(this.options.resetOptions);
        }
        catch (err)
        {
            console.log('failed to reset player state, next test will restart player');
            this.wantRestart = true;
            throw err;
        }
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
