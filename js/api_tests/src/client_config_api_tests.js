import { describe, test, assert } from 'vitest';
import { client, setupPlayer } from './test_env.js';

describe('client config api', () => {
    setupPlayer();

    test('client config', async () => {
        const id = 'api_test_' + Math.round(1000000 * Math.random());

        const config1 = await client.getClientConfig(id);
        assert.equal(config1, null);

        const value = { prop1: true, prop2: 'hello', prop3: { prop4: 123, prop5: ['item'] } };
        await client.setClientConfig(id, value);

        const config2 = await client.getClientConfig(id);
        assert.deepEqual(config2, value);

        await client.removeClientConfig(id);
        const config3 = await client.getClientConfig(id);
        assert.deepEqual(config3, null);
    });
});
