'use strict';

const { ApiClient } = require('../../client/api_client');
const EventExpectation = require('./event_expectation');
const { waitUntil } = require('./utils');

function createStateMatcher(condition)
{
    switch (typeof condition)
    {
        case 'function':
            return s => (
                s.player && condition(s.player)
            );

        case 'string':
            return s => (
                s.player && s.player.playbackState === condition
            );

        default:
            throw new TypeError('Invalid player state condition');
    }
}

class TestApiClient extends ApiClient
{
    constructor(handler)
    {
        super(handler);
    }

    async resetState()
    {
        await this.stop();
        const state = await this.waitForState('stopped');

        await this.setPlayerState({
            order: 'linear',
            loop: 'all',
            isMuted: false,
            volume: state.volume.max,
        });

        const playlists = await this.getPlaylists();

        for (let p of playlists)
            await this.removePlaylist(p.id);
    }

    async waitUntilReady()
    {
        return waitUntil(() => this.checkIsReady(), 400);
    }

    async checkIsReady()
    {
        try
        {
            await this.getPlayerState();
            return true;
        }
        catch(e)
        {
            return false;
        }
    }

    async waitForState(condition)
    {
        const expectation = this.expectUpdate(
            { player: true },
            createStateMatcher(condition),
            { useFirstEvent: true });

        await expectation.ready;
        await expectation.done;

        return expectation.lastEvent.player;
    }

    async getPlaylistFiles(plref, range)
    {
        const items = await this.getPlaylistItems(plref, ['%path%'], range);
        return items.map(i => i.columns[0]);
    }

    expectEvent(options, condition, expectationOptions)
    {
        return new EventExpectation(
            cb => this.queryEvents(options, cb),
            condition,
            expectationOptions);
    }

    expectUpdate(options, condition, expectationOptions)
    {
        return new EventExpectation(
            cb => this.queryUpdates(options, cb),
            condition,
            expectationOptions);
    }
}

module.exports = TestApiClient;
