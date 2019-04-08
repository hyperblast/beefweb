'use strict';

const q = require('qunit');
const isEqual = require('lodash/isEqual');
const { client, usePlayer, tracks } = require('./test_context');
const { waitUntil, pathCollectionsEqual } = require('./utils');

q.module('playlists api', usePlayer());

q.test('get playlists', async assert =>
{
    const playlists = await client.getPlaylists();

    assert.ok(playlists);
    assert.equal(playlists.length, 1);

    const playlist = playlists[0];

    assert.equal(typeof playlist.id, 'string');
    assert.equal(typeof playlist.title, 'string');

    delete playlist.id;
    delete playlist.title;

    assert.deepEqual(playlist, {
        index: 0,
        isCurrent: true,
        itemCount: 0,
        totalTime: 0,
    });
});

q.test('get playlist items', async assert =>
{
    const columns = ['%track%'];

    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);

    const expected = [
        { columns: ['01'] },
        { columns: ['02'] },
        { columns: ['03'] },
    ];

    const result1 = await client.getPlaylistItems(0, columns, '0:3');
    assert.equal(result1.offset, 0);
    assert.equal(result1.totalCount, 3);
    assert.deepEqual(result1.items, expected);

    const result2 = await client.getPlaylistItems(0, columns, '0:2');
    assert.equal(result2.offset, 0);
    assert.equal(result2.totalCount, 3);
    assert.deepEqual(result2.items, expected.slice(0, 2));

    const result3 = await client.getPlaylistItems(0, columns, '2:2');
    assert.equal(result3.offset, 2);
    assert.equal(result3.totalCount, 3);
    assert.deepEqual(result3.items, expected.slice(2, 3));

    const result4 = await client.getPlaylistItems(0, columns, '4:4');
    assert.equal(result4.offset, 3);
    assert.equal(result4.totalCount, 3);
    assert.deepEqual(result4.items, []);
});

q.test('add playlist simple', async assert =>
{
    await client.addPlaylist();

    const playlists = await client.getPlaylists();
    assert.equal(playlists.length, 2);

    const playlist = playlists[1];
    assert.equal(typeof playlist.id, 'string');
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
    assert.equal(typeof playlist.id, 'string');
    delete playlist.id;

    assert.deepEqual(playlist, {
        index: 0,
        title: 'My playlist',
        isCurrent: false,
        itemCount: 0,
        totalTime: 0,
    });
});

q.test('set current playlist', async assert =>
{
    await client.addPlaylist();
    await client.setCurrentPlaylist(1);

    const playlists = await client.getPlaylists();
    assert.equal(playlists[0].isCurrent, false);
    assert.equal(playlists[1].isCurrent, true);
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

q.test('rename playlist', async assert =>
{
    await client.renamePlaylist(0, 'My cool list');
    const playlists = await client.getPlaylists();
    assert.equal(playlists[0].title, 'My cool list');
});

q.test('add playlist items single', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t1]));
});

q.test('add playlist items url', async assert =>
{
    const streamUrl = 'https://upload.wikimedia.org/wikipedia/en/d/d0/Rick_Astley_-_Never_Gonna_Give_You_Up.ogg';

    await client.addPlaylistItems(0, [streamUrl]);

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [streamUrl]));
});

q.test('add playlist items multiple', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t1, tracks.t2, tracks.t3], true));
});

q.test('add playlist items to position', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t1], { index: 0 });
    await client.addPlaylistItems(0, [tracks.t3], { index: 1 });

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t1, tracks.t3, tracks.t2]));
});

q.test('add playlist items async', async assert =>
{
    await client.addPlaylistItems(
        0, [tracks.t1, tracks.t2, tracks.t3], { async: true });

    assert.equal(client.handler.lastStatus, 202);

    const files = await waitUntil(async () =>
    {
        const result = await client.getPlaylistFiles(0);
        return result.length === 3 ? result : null;
    });

    assert.ok(pathCollectionsEqual(files, [tracks.t1, tracks.t2, tracks.t3], true));
});

q.test('sort playlist items asc', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t1, tracks.t3]);
    await client.sortPlaylistItems(0, { by: '%tracknumber%' });

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t1, tracks.t2, tracks.t3]));
});

q.test('sort playlist items desc', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t1, tracks.t3]);
    await client.sortPlaylistItems(0, { by: '%tracknumber%', desc: true });

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t3, tracks.t2, tracks.t1]));
});

q.test('sort playlist items random', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    const initialFiles = await client.getPlaylistFiles(0);

    for (let i = 0; i < 10; i++)
    {
        await client.sortPlaylistItems(0, { random: true });
        const files = await client.getPlaylistFiles(0);

        if (!pathCollectionsEqual(initialFiles, files))
        {
            assert.ok(true);
            return;
        }
    }

    assert.ok(false, 'expected to sort playlist randomly');
});

q.test('remove playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.removePlaylistItems(0, [0, 2]);

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t2]));
});

q.test('move playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.movePlaylistItems({
        playlist: 0,
        items: [1, 2],
        targetIndex: 0
    });

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t2, tracks.t3, tracks.t1]));
});

q.test('move playlist items between playlists', async assert =>
{
    await client.addPlaylist();
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);
    await client.addPlaylistItems(1, [tracks.t3]);
    await client.movePlaylistItems({
        from: 0,
        to: 1,
        items: [1, 2]
    });

    const files1 = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files1, [tracks.t1]));

    const files2 = await client.getPlaylistFiles(1);
    assert.ok(pathCollectionsEqual(files2, [tracks.t3, tracks.t2, tracks.t3]));
});

q.test('copy playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);
    await client.copyPlaylistItems({
        playlist: 0,
        items: [0, 1],
        targetIndex: 1
    });

    const files = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files, [tracks.t1, tracks.t1, tracks.t2, tracks.t2, tracks.t3]));
});

q.test('copy playlist items between playlists', async assert =>
{
    await client.addPlaylist();
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);
    await client.addPlaylistItems(1, [tracks.t3]);
    await client.copyPlaylistItems({
        from: 0,
        to: 1,
        items: [0, 1]
    });

    const files1 = await client.getPlaylistFiles(0);
    assert.ok(pathCollectionsEqual(files1, [tracks.t1, tracks.t2, tracks.t3]));

    const files2 = await client.getPlaylistFiles(1);
    assert.ok(pathCollectionsEqual(files2, [tracks.t3, tracks.t1, tracks.t2]));
});
