import q from 'qunit';
import context from './test_context.js';

const { client, tracks, usePlayer } = context;

q.module('query api', usePlayer());

q.test('query player', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.pause();
    await client.waitForState('paused');

    const columns = ['%title%'];
    const player = await client.getPlayerState(columns);
    const result = await client.query({ player: true, trcolumns: columns });

    assert.deepEqual(result.player, player);
});

q.test('query playlists', async assert =>
{
    await client.addPlaylist({ title: 'My playlist' });

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
        plcolumns: columns,
    });

    assert.deepEqual(result.playlistItems, playlistItems);
});

q.test('query all', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2, tracks.t3]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.pause();
    await client.waitForState('paused');

    await client.addPlaylist({ title: 'My playlist' });

    const columns = ['%title%'];

    const expected = {
        player: await client.getPlayerState(columns),
        playlists: await client.getPlaylists(),
        playlistItems: await client.getPlaylistItems(0, columns),
    };

    const result = await client.query({
        player: true,
        trcolumns: columns,
        playlists: true,
        playlistItems: true,
        plref: 0,
        plcolumns: columns,
    });

    assert.deepEqual(result, expected);
});

q.test('expect player events', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    const expectation = client.expectEvent(
        { player: true }, e => e.player === true);

    await expectation.ready;
    await client.play(0, 0);
    await expectation.done;

    assert.ok(true);
});

q.test('expect playlist events', async assert =>
{
    const expectation = client.expectEvent(
        { playlists: true }, e => e.playlists === true);

    await expectation.ready;
    await client.addPlaylist();
    await expectation.done;

    assert.ok(true);
});

q.test('expect playlist items events', async assert =>
{
    const expectation = client.expectEvent(
        { playlistItems: true }, e => e.playlistItems === true);

    await expectation.ready;
    await client.addPlaylistItems(0, [tracks.t1]);
    await expectation.done;

    assert.ok(true);
});

q.test('expect player updates', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    const expectation = client.expectUpdate(
        { player: true }, e => typeof e.player === 'object');

    await expectation.ready;
    await client.play(0, 0);
    await expectation.done;

    const expected = await client.getPlayerState();
    delete expected.activeItem.position;

    const actual = expectation.lastEvent.player;
    delete actual.activeItem.position;

    assert.deepEqual(actual, expected);
});

q.test('expect playlist updates', async assert =>
{
    const expectation = client.expectUpdate(
        { playlists: true }, e => typeof e.playlists === 'object');

    await expectation.ready;
    await client.addPlaylist({ title: 'My list' });
    await expectation.done;

    const expected = await client.getPlaylists();
    const actual = expectation.lastEvent.playlists;

    assert.deepEqual(actual, expected);
});

q.test('expect playlist items updates when adding items', async assert =>
{
    const columns = ['%title%'];
    const options = {
        playlistItems: true,
        plref: 0,
        plcolumns: columns,
    };

    const expectation = client.expectUpdate(
        options, e => typeof e.playlistItems === 'object');

    await expectation.ready;
    await client.addPlaylistItems(0, [tracks.t1]);
    await expectation.done;

    const expected = await client.getPlaylistItems(0, columns);
    const actual = expectation.lastEvent.playlistItems;

    assert.deepEqual(actual, expected);
});

q.test('expect playlist items updates when removing items', async assert =>
{
    const columns = ['%title%'];
    const options = {
        playlistItems: true,
        plref: 0,
        plcolumns: columns,
    };

    await client.addPlaylistItems(0, [tracks.t1, tracks.t2]);

    const expectation = client.expectUpdate(
        options, e => typeof e.playlistItems === 'object');

    await expectation.ready;
    await client.removePlaylistItems(0, [0]);
    await expectation.done;

    const expected = await client.getPlaylistItems(0, columns);
    const actual = expectation.lastEvent.playlistItems;

    assert.deepEqual(actual, expected);
});

q.test('expect volume updates', async assert =>
{
    const { volume } = await client.getPlayerState();

    const targetVolume = (volume.min + volume.max) / 2;

    const expectation = client.expectUpdate(
        { player: true },
        e => e.player && e.player.volume.value === targetVolume);

    await expectation.ready;
    await client.setVolume(targetVolume);
    await expectation.done;

    assert.ok(true);
});

q.test('expect mute state updates', async assert =>
{
    const expectation = client.expectUpdate(
        { player: true },
        e => e.player && e.player.volume.isMuted);

    await expectation.ready;
    await client.setMuted(true);
    await expectation.done;

    assert.ok(true);
});

q.test('expect active item updates when sorting playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.play(0, 0);
    await client.waitForState('playing');

    const expectation = client.expectUpdate(
        { player: true },
        e => e.player && e.player.activeItem.index === 2);

    await expectation.ready;
    await client.sortPlaylistItems(0, { by: '%tracknumber%', desc: true });
    await expectation.done;

    assert.ok(true);
});

q.test('expect active item updates when adding playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.play(0, 0);
    await client.waitForState('playing');

    const expectation = client.expectUpdate(
        { player: true },
        e => e.player && e.player.activeItem.index === 1);

    await expectation.ready;
    await client.addPlaylistItems(0, [tracks.t2], { index: 0 });
    await expectation.done;

    assert.ok(true);
});

q.test('expect active item updates when removing playlist items', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);
    await client.play(0, 2);
    await client.waitForState('playing');

    const expectation = client.expectUpdate(
        { player: true },
        e => e.player && e.player.activeItem.index === 1);

    await expectation.ready;
    await client.removePlaylistItems(0, [0]);
    await expectation.done;

    assert.ok(true);
});
