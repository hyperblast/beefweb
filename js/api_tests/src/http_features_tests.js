'use strict';

const q = require('qunit');
const { client, usePlayer } = require('./test_context');

const options = { environment: {'BEEFWEB_CORS_HEADER':'http://whatever' } };

q.module('http features', usePlayer(options));

q.test('options method', async assert =>
{
    const response = await client.handler.axios.get('/api/player');

    assert.strictEqual(response.headers['access-control-allow-origin'], 'http://whatever');
    assert.strictEqual(response.headers['access-control-allow-headers'], 'Content-Type');
    assert.strictEqual(response.headers['access-control-allow-methods'], 'GET, POST, OPTIONS');
});
