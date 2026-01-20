import { describe, test, assert } from 'vitest';
import { client, tracks, outputConfigs, usePlayer } from './test_env.js';

describe('query api', () => {
    usePlayer();

    test('query player', async () => {
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

    test('query playlists', async () => {
        await client.addPlaylist({ title: 'My playlist' });

        const playlists = await client.getPlaylists();
        const result = await client.query({ playlists: true });

        assert.deepEqual(result.playlists, playlists);
    });

    test('query playlist items', async () => {
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

    test('query outputs', async () => {
        const queue = await client.getOutputs();
        const result = await client.query({ outputs: true });
        assert.deepEqual(result.outputs, queue);
    });

    test('query all', async () => {
        await client.addPlaylistItems(0, [tracks.t2, tracks.t3]);
        await client.addToPlayQueue(0, 1);

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
            playQueue: await client.getPlayQueue(),
            outputs: await client.getOutputs(),
        };

        const result = await client.query({
            player: true,
            trcolumns: columns,
            playlists: true,
            playlistItems: true,
            plref: 0,
            plcolumns: columns,
            playQueue: true,
            outputs: true,
        });

        assert.deepEqual(result, expected);
    });

    test('expect player events', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        const expectation = client.expectEvent({ player: true }, e => e.player === true);

        await expectation.ready;
        await client.play(0, 0);
        await expectation.done;

        assert.ok(true);
    });

    test('expect playlist events', async () => {
        const expectation = client.expectEvent({ playlists: true }, e => e.playlists === true);

        await expectation.ready;
        await client.addPlaylist();
        await expectation.done;

        assert.ok(true);
    });

    test('expect playlist items events', async () => {
        const expectation = client.expectEvent({ playlistItems: true }, e => e.playlistItems === true);

        await expectation.ready;
        await client.addPlaylistItems(0, [tracks.t1]);
        await expectation.done;

        assert.ok(true);
    });

    test('expect play queue events', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        const expectation = client.expectEvent({ playQueue: true }, e => e.playQueue === true);

        await expectation.ready;
        await client.addToPlayQueue(0, 0);
        await expectation.done;

        assert.ok(true);
    });

    test('expect output config events', async () => {
        const expectation = client.expectEvent({ outputs: true }, e => e.outputs === true);
        await expectation.ready;
        await client.setOutputDevice(outputConfigs.alternate[0].typeId, outputConfigs.alternate[0].deviceId);
        await expectation.done;
        assert.ok(true);
    });

    test('expect player updates', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        const expectation = client.expectUpdate({ player: true }, e => typeof e.player === 'object');

        await expectation.ready;
        await client.play(0, 0);
        await expectation.done;

        const expected = await client.getPlayerState();
        delete expected.activeItem.position;

        const actual = expectation.lastEvent.player;
        delete actual.activeItem.position;

        assert.deepEqual(actual, expected);
    });

    test('expect playlist updates', async () => {
        const expectation = client.expectUpdate({ playlists: true }, e => typeof e.playlists === 'object');

        await expectation.ready;
        await client.addPlaylist({ title: 'My list' });
        await expectation.done;

        const expected = await client.getPlaylists();
        const actual = expectation.lastEvent.playlists;

        assert.deepEqual(actual, expected);
    });

    test('expect playlist items updates when adding items', async () => {
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

    test('expect playlist items updates when removing items', async () => {
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

    test('expect volume updates', async () => {
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

    test('expect mute state updates', async () => {
        const expectation = client.expectUpdate(
            { player: true },
            e => e.player && e.player.volume.isMuted);

        await expectation.ready;
        await client.setMuted(true);
        await expectation.done;

        assert.ok(true);
    });

    test('expect active item updates when sorting playlist items', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.addPlaylistItems(0, [tracks.t2]);
        await client.play(0, 0);
        await client.waitForState('playing');

        const expectation = client.expectUpdate(
            { player: true },
            e => e.player && e.player.activeItem.index === 1);

        await expectation.ready;
        await client.sortPlaylistItems(0, { by: '%tracknumber%', desc: true });
        await expectation.done;

        assert.ok(true);
    });

    test('expect active item updates when adding playlist items', async () => {
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

    test('expect active item updates when removing playlist items', async () => {
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

    test('expect play queue updates', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        const columns = ['%artist%', '%title%'];
        const expectation = client.expectUpdate(
            { playQueue: true, qcolumns: columns },
            e => typeof e.playQueue === 'object' && e.playQueue.length > 0);

        await expectation.ready;
        await client.addToPlayQueue(0, 0);
        await expectation.done;

        const expected = await client.getPlayQueue(columns);
        const actual = expectation.lastEvent.playQueue;

        assert.deepEqual(actual, expected);
    });

    test('expect output config updates', async () => {
        const expectation = client.expectUpdate({ outputs: true }, e => typeof e.outputs === 'object');
        await expectation.ready;
        await client.setOutputDevice(outputConfigs.alternate[0].typeId, outputConfigs.alternate[0].deviceId);
        await expectation.done;

        const expected = await client.getOutputs();
        const actual = expectation.lastEvent.outputs;

        assert.deepEqual(actual, expected);
    });
});