import q from 'qunit';
import { client, config, tracks, usePlayer } from './test_env.js';

q.module('player api', usePlayer());

q.test('get state', async assert =>
{
    const state = await client.getPlayerState();
    assert.ok(state);

    const { info, activeItem, playbackState, volume, playbackMode, playbackModes } = state;

    assert.ok(info);
    assert.ok(info.name);
    assert.ok(info.title);
    assert.ok(info.version);
    assert.ok(info.pluginVersion);

    assert.ok(activeItem);
    const { playlistId, playlistIndex, index, position, duration } = activeItem;
    assert.equal(typeof playlistId, 'string');
    assert.equal(typeof playlistIndex, 'number');
    assert.equal(typeof index, 'number');
    assert.equal(typeof position, 'number');
    assert.equal(typeof duration, 'number');

    assert.ok(playbackState);
    assert.equal(typeof playbackState, 'string');

    assert.ok(volume);
    const { type, min, max, value, isMuted } = volume;
    assert.equal(typeof type, 'string');
    assert.equal(typeof min, 'number');
    assert.equal(typeof max, 'number');
    assert.equal(typeof value, 'number');
    assert.equal(typeof isMuted, 'boolean');

    assert.equal(typeof playbackMode, 'number');
    assert.ok(Array.isArray(playbackModes));
});

q.test('query current track', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState('playing');
    await client.waitPlaybackMetadata();

    let backslash = '\\';

    if (config.playerId === 'deadbeef')
        backslash = '\\\\';

    const state = await client.getPlayerState([
        '%genre%',
        '%artist%',
        '%album%',
        '%tracknumber%',
        '%title%',
        '%length%',
        ` %artist% ${backslash} %album%, %title% `,
    ]);

    assert.deepEqual(state.activeItem.columns, [
        'Ambient',
        'Hyperblast',
        'Silence Rocks',
        '03',
        'Silence Rocks - Part 3',
        '1:10',
        ' Hyperblast \\ Silence Rocks, Silence Rocks - Part 3 '
    ]);
});

q.test('set volume', async assert =>
{
    let state = await client.getPlayerState();
    const newVolume = (state.volume.min + state.volume.max) / 2;
    await client.setVolume(newVolume);

    state = await client.getPlayerState();
    assert.equal(state.volume.value, newVolume);
});

q.test('volume step', async assert =>
{
    const state1 = await client.getPlayerState();

    await client.volumeStep(-1);
    const state2 = await client.getPlayerState();
    assert.ok(state2.volume.value < state1.volume.value);

    await client.volumeStep(1);
    const state3 = await client.getPlayerState();
    assert.equal(state3.volume.value, state1.volume.value);
});

q.test('set muted', async assert =>
{
    await client.setMuted(true);

    const state = await client.getPlayerState();
    assert.equal(state.volume.isMuted, true);
});

q.test('set playback mode', async assert =>
{
    let state = await client.getPlayerState();
    const newMode = state.playbackModes.length - 1;
    await client.setPlaybackMode(newMode);

    state = await client.getPlayerState();
    assert.equal(state.playbackMode, newMode);
});

q.test('set bool option', async assert =>
{
    let state = await client.getPlayerState();
    let option = state.options.find(o => o.type === 'bool');
    assert.ok(option.name);
    assert.equal(option.value, false);

    await client.setOption(option.id, true);

    state = await client.getPlayerState();
    option = state.options.find(o => o.id === option.id);
    assert.ok(option.value);
});

q.test('set enum option', async assert =>
{
    let state = await client.getPlayerState();
    let option = state.options.find(o => o.type === 'enum');
    assert.ok(option.name);
    assert.ok(Array.isArray(option.enumNames));
    assert.equal(option.value, 0);

    await client.setOption(option.id, 1);

    state = await client.getPlayerState();
    option = state.options.find(o => o.id === option.id);
    assert.equal(option.value, 1);
});

q.test('play', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    await client.play(0, 1);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 1;
    });

    assert.ok(true);
});

q.test('stop', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.stop();
    await client.waitForState('stopped');

    assert.ok(true);
});

q.test('play random', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.playRandom();
    await client.waitForState('playing');

    assert.ok(true);
});

q.test('play current', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.pause();
    await client.waitForState('paused');

    await client.playCurrent();
    await client.waitForState('playing');

    assert.ok(true);
});

q.test('pause', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.pause();
    await client.waitForState('paused');

    assert.ok(true);
});

q.test('toggle pause', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState('playing');

    await client.togglePause();
    await client.waitForState('paused');

    await client.togglePause();
    await client.waitForState('playing');

    assert.ok(true);
});

q.test('next', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    await client.next();
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 1;
    });

    assert.ok(true);
});

q.test('next by', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    await client.next({ by: '%title%' });
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 2;
    });

    assert.ok(true);
});

q.test('previous', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    await client.play(0, 1);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 1;
    });

    await client.previous();
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    assert.ok(true);
});

q.test('previous by', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.addPlaylistItems(0, [tracks.t2]);
    await client.addPlaylistItems(0, [tracks.t2]);

    await client.play(0, 2);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 2;
    });

    await client.previous({ by: '%title%' });
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    assert.ok(true);
});

q.test('set playback position', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    await client.pause();
    await client.waitForState('paused');

    await client.setPlaybackPosition(33.0);
    await client.waitForState(s => {
        return s.activeItem.position === 33.0;
    });

    assert.ok(true);
});

q.test('move playback position', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    await client.pause();
    await client.waitForState('paused');

    await client.setPlaybackPosition(33.0);
    await client.waitForState(s => {
        return s.activeItem.position === 33.0;
    });

    await client.movePlaybackPosition(11.0);
    await client.waitForState(s => {
        return s.activeItem.position === 44.0;
    });

    assert.ok(true);
});
