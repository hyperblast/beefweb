'use strict';

const q = require('qunit');
const { client, moduleHooks } = require('./test_context');

q.module('player api', moduleHooks);

q.test('getPlayerState', async assert => {
    const state = await client.getPlayerState();

    assert.ok(state.player);
});