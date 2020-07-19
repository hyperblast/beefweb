'use strict';

const q = require('qunit');
const { client, usePlayer } = require('./test_context');

const expectedValue = "Very Custom, Much Configurable, Wow";

const pluginSettings = {
    responseHeaders: {
        "X-CustomHeader": expectedValue
    }
};

q.module('http features', usePlayer({ pluginSettings }));

q.test('custom headers', async assert =>
{
    const response = await client.handler.axios.get('/api/player');

    assert.strictEqual(response.headers['x-customheader'], expectedValue);
});

q.test('options method', async assert =>
{
    const response = await client.handler.axios.options('/api/player');

    assert.strictEqual(response.headers['x-customheader'], expectedValue);
});
