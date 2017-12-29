'use strict';

const q = require('qunit');
const { client, moduleHooks } = require('./test_context');

q.module('playlists api', moduleHooks);

q.test('get playlists', async assert =>
{
    const playlists = await client.getPlaylists();
    assert.ok(Array.isArray(playlists));
    assert.ok(playlists.length, 1);
});