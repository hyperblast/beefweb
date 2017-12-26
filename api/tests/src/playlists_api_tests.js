'use strict';

const q = require('qunit');
const { client, moduleHooks } = require('./test_context');

q.module('playlists api', moduleHooks);

q.test('getPlaylists', async assert => {
    const result = await client.getPlaylists();
    assert.ok(Array.isArray(result.playlists));
    assert.ok(result.playlists.length, 1);
});