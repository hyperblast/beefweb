import { PlayerClient } from 'beefweb-client';
import EventExpectation from './event_expectation.js';
import { waitUntil } from './utils.js';

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

function getDefaultState(option)
{
    return {
        id: option.id,
        value: option.type === 'enum' ? 0 : false
    };
}

class TestPlayerClient extends PlayerClient
{
    constructor(handler)
    {
        super(handler);
    }

    async resetState(options)
    {
        if (options.playerState)
        {
            await this.stop();
            const state = await this.waitForState('stopped');

            await this.setPlayerState({
                isMuted: false,
                volume: state.volume.max,
                playbackMode: 0,
                options: state.options.map(o => getDefaultState(o)),
            });
        }

        await this.clearPlayQueue();

        const playlists = await this.getPlaylists();

        for (let p of playlists)
            await this.removePlaylist(p.id);

        if (options.output)
        {
            const config = options.outputConfigs.default;
            await this.setOutputDevice(config.typeId, config.deviceId);
        }
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

    async waitPlaybackMetadata()
    {
        await waitUntil(async () =>
        {
            const state = await this.getPlayerState(['%artist%']);
            return state.activeItem.columns[0] === 'Hyperblast';
        });
    }

    async waitMetadata(plref, item)
    {
        await waitUntil(async () =>
        {
            const result = await this.getPlaylistItems(plref, ['%artist%'], item);
            return result.items[0].columns[0] === 'Hyperblast';
        });
    }

    async getPlaylistFiles(plref, range)
    {
        const result = await this.getPlaylistItems(plref, ['%path%'], range);
        return result.items.map(i => i.columns[0]);
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

export default TestPlayerClient;
