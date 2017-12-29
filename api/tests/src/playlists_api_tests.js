'use strict';

const q = require('qunit');
const { client, moduleHooks, tracks } = require('./test_context');

q.module('playlists api', moduleHooks);

q.test('get playlists', async assert =>
{
    const playlists = await client.getPlaylists();

    assert.ok(playlists);
    assert.equal(playlists.length, 1);

    const playlist = playlists[0];
    assert.ok(playlist.id);
    delete playlist.id;

    assert.deepEqual(playlist, {
      index: 0,
      title: 'Default',
      isCurrent: true,
      itemCount: 0,
      totalTime: 0,
    });
});

q.test('add playlist simple', async assert =>
{
    await client.addPlaylist();

    const playlists = await client.getPlaylists();
    assert.equal(playlists.length, 2);

    const playlist = playlists[1];
    assert.ok(playlist.id);
    delete playlist.id;

    assert.deepEqual(playlist, {
      index: 1,
      title: 'New playlist',
      isCurrent: false,
      itemCount: 0,
      totalTime: 0,
    });
});

q.test('add playlist full', async assert =>
{
    await client.addPlaylist({ title: 'My playlist', index: 0 });

    const playlists = await client.getPlaylists();
    assert.equal(playlists.length, 2);

    const playlist = playlists[0];
    assert.ok(playlist.id);
    delete playlist.id;

    assert.deepEqual(playlist, {
      index: 0,
      title: 'My playlist',
      isCurrent: false,
      itemCount: 0,
      totalTime: 0,
    });
});

q.test('add playlist simple', async assert =>
{
    await client.addPlaylist();

    const playlists = await client.getPlaylists();
    assert.equal(playlists.length, 2);

    const playlist = playlists[1];
    assert.ok(playlist.id);
    delete playlist.id;

    assert.deepEqual(playlist, {
      index: 1,
      title: 'New playlist',
      isCurrent: false,
      itemCount: 0,
      totalTime: 0,
    });
});

q.test('remove playlist', async assert =>
{
    await client.addPlaylist();
    let playlists = await client.getPlaylists();

    const id = playlists[1].id;
    await client.removePlaylist(id);

    playlists = await client.getPlaylists();
    assert.equal(playlists.findIndex(i => i.id === id), -1);
});

q.test('move playlist', async assert =>
{
    await client.addPlaylist();
    await client.addPlaylist();
    let playlists = await client.getPlaylists();

    const id1 = playlists[1].id;
    const id2 = playlists[2].id;

    await client.movePlaylist(id1, 2);

    playlists = await client.getPlaylists();
    assert.equal(playlists[1].id, id2);
    assert.equal(playlists[2].id, id1);
});

q.test('add playlist items simple', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    const items = await client.getPlaylistItems(0, ['%path%']);
    const addedTracks = items.map(i => i.columns[0]);

    assert.deepEqual(addedTracks, [tracks.t1, tracks.t2, tracks.t3]);
});
