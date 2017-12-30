'use strict';

const q = require('qunit');
const { client, moduleHooks, tracks } = require('./test_context');

q.module('browser api', moduleHooks);

q.test('query player', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.pause();
    await client.waitForState(s => {
        return s.playbackState === 'paused';
    });

    const columns = ['%title%'];
    const player = await client.getPlayerState(columns);
    const result = await client.query({ player: true, trcolumns: columns });

    assert.deepEqual(result.player, player);
});

q.test('query playlists', async assert =>
{
    await client.addPlaylist();

    const playlists = await client.getPlaylists();
    const result = await client.query({ playlists: true });

    assert.deepEqual(result.playlists, playlists);
});

q.test('query playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t3]);

    const columns = ['%title%'];
    const playlistItems = await client.getPlaylistItems(0, columns);

    const result = await client.query({
        playlistItems: true,
        plref: 0,
        plrange: '0:100',
        plcolumns: columns,
    });

    assert.deepEqual(result.playlistItems, playlistItems);
});
