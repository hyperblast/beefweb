import q from 'qunit';
import { client, outputConfigs, usePlayer } from './test_env.js';

const pluginSettings = {
    permissions: {
        allowChangePlaylists: false,
        allowChangeOutput: false,
        allowChangeClientConfig: false,
    }
};

const resetOptions = {
    playlists: false,
    output: false
};

const axiosConfig = {
    validateStatus: () => true,
};

function post(path, data)
{
    return client.handler.axios.post(path, data);
}

q.module('permissions', usePlayer({ pluginSettings, resetOptions, axiosConfig }));

q.test('get permissions', async assert =>
{
    const state = await client.getPlayerState();
    assert.deepEqual(state.permissions, pluginSettings.permissions);
});

q.test('change playlist', async assert =>
{
    const response = await post('/api/playlists/add');
    assert.equal(response.status, 403);
});

q.test('change output', async assert =>
{
    const response = await post('/api/output/active', outputConfigs.alternate[0]);
    assert.equal(response.status, 403);
});

q.test('change client config', async assert =>
{
    const response = await post('/api/clientconfig/perm_test', {});
    assert.equal(response.status, 403);
});