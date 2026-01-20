import { describe, test, assert } from 'vitest';
import { client, config, tracks, usePlayer } from './test_env.js';

// DeaDBeeF clears play queue asynchronously on stop
// Avoid resetting player state for stable runs
const resetOptions = {
    playerState: false
};

describe('play queue api', () => {
    usePlayer({ resetOptions });

    async function setupTracks()
    {
        await client.addPlaylist();

        const playlists = await client.getPlaylists();

        const p1 = playlists[0].id;
        const p2 = playlists[1].id;

        await client.addPlaylistItems(p1, [tracks.t1]);
        await client.addPlaylistItems(p1, [tracks.t2]);
        await client.addPlaylistItems(p2, [tracks.t3]);

        return [p1, p2];
    }

    test('get play queue with columns', async () => {
        const [p1] = await setupTracks();

        await client.addToPlayQueue(p1, 0);
        await client.addToPlayQueue(p1, 1);

        const queue = await client.getPlayQueue(['%artist%', '%title%']);

        assert.deepEqual(queue, [
            { playlistIndex: 0, playlistId: p1, itemIndex: 0, columns: ['Hyperblast', 'Silence Rocks - Part 1'] },
            { playlistIndex: 0, playlistId: p1, itemIndex: 1, columns: ['Hyperblast', 'Silence Rocks - Part 2'] },
        ]);
    })

    test('add to queue', async () => {
        const [p1, p2] = await setupTracks();

        await client.addToPlayQueue(p1, 1);
        await client.addToPlayQueue(1, 0);

        const queue = await client.getPlayQueue();

        assert.deepEqual(queue, [
            { playlistIndex: 0, playlistId: p1, itemIndex: 1, columns: [] },
            { playlistIndex: 1, playlistId: p2, itemIndex: 0, columns: [] },
        ]);
    });

    test('add to queue at index', async () => {
        if (config.playerId !== 'deadbeef')
        {
            assert.ok('adding to queue at index is not supported by current player');
            return;
        }

        const [p1, p2] = await setupTracks();

        await client.addToPlayQueue(p1, 0);
        await client.addToPlayQueue(0, 1, 1);
        await client.addToPlayQueue(p2, 0, 0);

        let queue = await client.getPlayQueue();

        assert.deepEqual(queue, [
            { playlistIndex: 1, playlistId: p2, itemIndex: 0, columns: [] },
            { playlistIndex: 0, playlistId: p1, itemIndex: 0, columns: [] },
            { playlistIndex: 0, playlistId: p1, itemIndex: 1, columns: [] },
        ]);
    });

    test('remove from queue', async () => {
        const [p1, p2] = await setupTracks();

        await client.addToPlayQueue(p1, 0);
        await client.addToPlayQueue(p1, 1);
        await client.addToPlayQueue(p2, 0);

        await client.removeFromPlayQueueByQueueIndex(0);
        await client.removeFromPlayQueueByItemIndex(p2, 0);

        let queue = await client.getPlayQueue();

        assert.deepEqual(queue, [
            { playlistIndex: 0, playlistId: p1, itemIndex: 1, columns: [] },
        ]);
    });

    test('clear queue', async () => {
        const [p1, p2] = await setupTracks();

        await client.addToPlayQueue(p1, 0);
        await client.addToPlayQueue(p1, 1);
        await client.addToPlayQueue(p2, 0);

        await client.clearPlayQueue();

        let queue = await client.getPlayQueue();

        assert.equal(queue.length, 0);
    });
});