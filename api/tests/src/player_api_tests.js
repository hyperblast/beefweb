'use strict';

const q = require('qunit');
const { client, moduleHooks, tracks } = require('./test_context');

q.module('player api', moduleHooks);

q.test('get state', async assert =>
{
    const state = await client.getPlayerState();
    assert.ok(state);

    const { activeItem, playbackState, volume, options } = state;

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
    const { amp, db, dbMin, isMuted } = volume;
    assert.equal(typeof amp, 'number');
    assert.equal(typeof db, 'number');
    assert.equal(typeof dbMin, 'number');
    assert.equal(typeof isMuted, 'boolean');

    assert.ok(options);
    const { loop, order } = options;
    assert.equal(typeof loop, 'string');
    assert.equal(typeof order, 'string');
});

q.test('query current track', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    const state = await client.getPlayerState([
        '%genre%',
        '%artist%',
        '%album%',
        '%tracknumber%',
        '%title%',
        '%length%'
    ]);

    assert.deepEqual(state.activeItem.columns, [
        'Ambient',
        'Hyperblast',
        'Silence Rocks',
        '03',
        'Silence Rocks - Part 3',
        '1:10',
    ]);
});

q.test('set volume db', async assert =>
{
    await client.setPlayerState({ volumeDb: -5.0 });

    const state = await client.getPlayerState();
    assert.equal(state.volume.db, -5.0);
});

q.test('set volume amp', async assert =>
{
    await client.setPlayerState({ volumeAmp: 0.5 });

    const state = await client.getPlayerState();
    assert.equal(state.volume.amp, 0.5);
});

q.test('set muted', async assert =>
{
    await client.setPlayerState({ isMuted: true });

    const state = await client.getPlayerState();
    assert.equal(state.volume.isMuted, true);
});

q.test('set loop mode', async assert =>
{
    await client.setPlayerState({ loop: 'single' });

    const state = await client.getPlayerState();
    assert.equal(state.options.loop, 'single');
});

q.test('set playback order', async assert =>
{
    await client.setPlayerState({ order: 'random' });

    const state = await client.getPlayerState();
    assert.equal(state.options.order, 'random');
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
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.stop();
    await client.waitForState(s => {
        return s.playbackState === 'stopped';
    });

    assert.ok(true);
});

q.test('play random', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.playRandom();
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    assert.ok(true);
});

q.test('play current', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.pause();
    await client.waitForState(s => {
        return s.playbackState === 'paused';
    });

    await client.playCurrent();
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    assert.ok(true);
});

q.test('pause', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.pause();
    await client.waitForState(s => {
        return s.playbackState === 'paused';
    });

    assert.ok(true);
});

q.test('toggle pause', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.togglePause();
    await client.waitForState(s => {
        return s.playbackState === 'paused';
    });

    await client.togglePause();
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    assert.ok(true);
});

q.test('next', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    await client.play(0, 0);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.next();
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 1;
    });

    assert.ok(true);
});

q.test('previous', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

    await client.play(0, 1);
    await client.waitForState(s => {
        return s.playbackState === 'playing';
    });

    await client.previous();
    await client.waitForState(s => {
        return s.playbackState === 'playing' && s.activeItem.index === 0;
    });

    assert.ok(true);
});

q.test('set position absolute', async assert =>
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

    await client.setPlayerState({ position: 33.0 });
    await client.waitForState(s => {
        return s.activeItem.position === 33.0;
    });

    assert.ok(true);
});

q.test('set position relative', async assert =>
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

    await client.setPlayerState({ position: 33.0 });
    await client.waitForState(s => {
        return s.activeItem.position === 33.0;
    });

    await client.setPlayerState({ relativePosition: 11.0 });
    await client.waitForState(s => {
        return s.activeItem.position === 44.0;
    });

    assert.ok(true);
});
