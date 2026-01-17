import path from 'path'
import fsObj from 'fs';
import { fileURLToPath } from 'url'
import { getBuildConfig } from '../../config.mjs';
import RequestHandler from './request_handler.js';
import TestPlayerClient from './test_player_client.js';

const fs = fsObj.promises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PlayerId = Object.freeze({
    deadbeef: 'deadbeef',
    foobar2000: 'foobar2000'
});

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
        this.playerSetupDone = false;
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

        const { axiosConfig } = options;

        this.options = {
            pluginSettings,
            resetOptions,
            axiosConfig
        };
    }

    initClient()
    {
        this.client.handler.init(this.options.axiosConfig);
    }

    async startPlayer()
    {
        if (!this.playerSetupDone)
        {
            await this.player.setup();
            this.playerSetupDone = true;
        }

        await this.player.start(this.options);

        if (await this.client.waitUntilReady())
        {
            return;
        }

        const logData = await fs.readFile(this.player.logFile, 'utf8');

        if (logData)
            console.error('Player run log:\n%s', logData);

        throw new Error('Failed to reach API endpoint');
    }
    
    async stopPlayer()
    {
        await this.player.stop();
    }

    async beginSuite(options = {})
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
        const { BEEFWEB_TEST_BUILD_TYPE: buildTypeEnv, BEEFWEB_TEST_PORT: portEnv } = process.env;

        const testsRootDir = path.dirname(__dirname);
        const rootDir = path.dirname(path.dirname(testsRootDir));
        const buildType = buildTypeEnv || 'Debug';
        const { buildDir, isMultiConfig } = getBuildConfig(buildType);
        const pluginBuildDir = path.join(
            buildDir,
            'cpp',
            'server',
            this.playerId,
            isMultiConfig ? buildType : '');

        const port = parseInt(portEnv) || 8879;
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
            playerId: this.playerId,
            buildType,
            port,
            serverUrl,
            rootDir,
            pluginBuildDir,
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
        throw new Error('craeteOutputConfigs() is not implemented');
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
