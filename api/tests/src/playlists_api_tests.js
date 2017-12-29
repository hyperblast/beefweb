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

q.test('clear playlist', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.clearPlaylist(0);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, []);
});

q.test('add playlist items simple', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t1, tracks.t2, tracks.t3]);
});

q.test('add playlist items to position', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t1], { index: 0 });
    await client.addPlaylistItems(0, [tracks.t3], { index: 1 });

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t1, tracks.t3, tracks.t2]);
});

q.test('sort playlist items asc', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t1, tracks.t3]);
    await client.sortPlaylistItems(0, '%tracknumber%');

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t1, tracks.t2, tracks.t3]);
});

q.test('sort playlist items desc', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t1, tracks.t3]);
    await client.sortPlaylistItems(0, '%tracknumber%', true);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t3, tracks.t2, tracks.t1]);
});

q.test('sort playlist items random', async assert =>
{
    const initialFiles = [tracks.t1, tracks.t2, tracks.t3];
    await client.addPlaylistItems(0, initialFiles);
    await client.sortPlaylistItemsRandom(0);

    const files = await client.getPlaylistFiles(0);
    assert.notDeepEqual(files, initialFiles);
});

q.test('remove playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.removePlaylistItems(0, [0, 2]);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t2]);
});

q.test('move playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.movePlaylistItems(0, [1, 2], 0);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t2, tracks.t3, tracks.t1]);
});

q.test('move playlist items between playlists', async assert =>
{
    await client.addPlaylist();
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.addPlaylistItems(1, [tracks.t3]);

    await client.movePlaylistItemsEx(0, 1, [1, 2]);

    const files1 = await client.getPlaylistFiles(0);
    assert.deepEqual(files1, [tracks.t1]);

    const files2 = await client.getPlaylistFiles(1);
    assert.deepEqual(files2, [tracks.t3, tracks.t2, tracks.t3]);
});

q.test('copy playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.copyPlaylistItems(0, [0, 1], 1);

    const files = await client.getPlaylistFiles(0);
    assert.deepEqual(files, [tracks.t1, tracks.t1, tracks.t2, tracks.t2, tracks.t3]);
});

q.test('copy playlist items between playlists', async assert =>
{
    await client.addPlaylist();
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.addPlaylistItems(1, [tracks.t3]);
    await client.copyPlaylistItemsEx(0, 1, [0, 1]);

    const files1 = await client.getPlaylistFiles(0);
    assert.deepEqual(files1, [tracks.t1, tracks.t2, tracks.t3]);

    const files2 = await client.getPlaylistFiles(1);
    assert.deepEqual(files2, [tracks.t3, tracks.t1, tracks.t2]);
});
