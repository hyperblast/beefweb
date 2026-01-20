import { describe, test, assert } from 'vitest';
import { client, tracks, usePlayer } from './test_env.js';

const expectedValue = 'Very Custom, Much Configurable, Wow';

const pluginSettings = {
    responseHeaders: {
        'X-CustomHeader': expectedValue
    }
};

describe('http features', () => {
    usePlayer({ pluginSettings });

    test('custom headers', async () => {
        const response = await client.handler.axios.get('/api/player');

        assert.strictEqual(response.headers['x-customheader'], expectedValue);
    });

    test('custom headers for async method', async () => {
        const response = await client.handler.axios.post('/api/playlists/0/items/add', { items: [tracks.t1] });

        assert.strictEqual(response.headers['x-customheader'], expectedValue);
    });

    test('options method', async () => {
        const response = await client.handler.axios.options('/api/player');

        assert.strictEqual(response.headers['x-customheader'], expectedValue);
    });

});