'use strict';

const q = require('qunit');
const { client, moduleHooks } = require('./test_context');

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

q.test('set muted amp', async assert =>
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