import q from 'qunit';
import context from './test_context.js';

const { client, tracks, usePlayer } = context;

const expectedValue = 'Very Custom, Much Configurable, Wow';

const pluginSettings = {
    responseHeaders: {
        'X-CustomHeader': expectedValue
    }
};

q.module('http features', usePlayer({ pluginSettings }));

q.test('custom headers', async assert =>
{
    const response = await client.handler.axios.get('/api/player');

    assert.strictEqual(response.headers['x-customheader'], expectedValue);
});

q.test('custom headers for async method', async assert =>
{
    const response = await client.handler.axios.post('/api/playlists/0/items/add', { items: [tracks.t1] });

    assert.strictEqual(response.headers['x-customheader'], expectedValue);
});

q.test('options method', async assert =>
{
    const response = await client.handler.axios.options('/api/player');

    assert.strictEqual(response.headers['x-customheader'], expectedValue);
});
