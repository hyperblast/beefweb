import q from 'qunit';
import { client, usePlayer } from './test_env.js';

q.module('user config api', usePlayer());

q.test('user config', async assert =>
{
    const id = 'api_test_' + Math.round(1000000 * Math.random());

    const config1 = await client.getUserConfig(id);
    assert.equal(config1, null);

    const value =  { prop1: true, prop2: 'hello', prop3: { prop4: 123, prop5: [ 'item' ] } };
    await client.setUserConfig(id, value);

    const config2 = await client.getUserConfig(id);
    assert.deepEqual(config2, value);

    await client.clearUserConfig(id);
    const config3 = await client.getUserConfig(id);
    assert.deepEqual(config3, null);
});