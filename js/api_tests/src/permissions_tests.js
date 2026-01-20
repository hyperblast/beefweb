import { describe, test, assert } from 'vitest';
import { client, outputConfigs, setupPlayer } from './test_env.js';

const pluginSettings = {
    permissions: {
        changePlaylists: false,
        changeOutput: false,
        changeClientConfig: false,
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
    return client.handler.axios.post(path, data, axiosConfig);
}

describe('permissions', () => {
    setupPlayer({ pluginSettings, resetOptions });

    test('get permissions', async () => {
        const state = await client.getPlayerState();
        assert.deepEqual(state.permissions, pluginSettings.permissions);
    });

    test('change playlist', async () => {
        const response = await post('/api/playlists/add');
        assert.equal(response.status, 403);
    });

    test('change output', async () => {
        const response = await post('/api/outputs/active', outputConfigs.alternate[0]);
        assert.equal(response.status, 403);
    });

    test('change client config', async () => {
        const response = await post('/api/clientconfig/perm_test', {});
        assert.equal(response.status, 403);
    });
});
