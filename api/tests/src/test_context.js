'use strict';

const path = require('path');
const ApiClient = require('./api_client');
const PlayerController = require('./player_controller');

class TestContext
{
    constructor()
    {
        const { API_TESTS_BUILD_TYPE, API_TESTS_PORT } = process.env;

        this.config = Object.freeze({
            buildType: API_TESTS_BUILD_TYPE  || 'debug',
            port: parseInt(API_TESTS_PORT) || 8879,
        });

        this.client = new ApiClient(`http://localhost:${this.config.port}`);
        this.player = new PlayerController(this.config);

        this.musicDir = this.player.paths.musicDir;
        this.tracks = Object.freeze({
            t1: path.join(this.musicDir, 'track1.flac'),
            t2: path.join(this.musicDir, 'track2.flac'),
            t3: path.join(this.musicDir, 'subdir/track3.flac'),
        });

        this.moduleHooks = Object.freeze({
            before: this.init.bind(this),
            after: this.shutdown.bind(this),
            beforeEach: this.prepare.bind(this),
        });
    }

    async init()
    {
        await this.player.start();

        if (await this.client.waitUntilReady())
            return;

        const logData = await this.player.getLog();
        console.error('Player run log:\n%s', logData);
        throw Error('Failed to reach API endpoint');
    }

    async shutdown()
    {
        this.client.cancelRequests();
        await this.player.stop();
    }

    async prepare()
    {
        await this.client.resetState();
    }
}

module.exports = new TestContext();