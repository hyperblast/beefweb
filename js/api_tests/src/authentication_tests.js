import { describe, test, assert } from 'vitest';
import lodash from 'lodash';
import { client, usePlayer } from './test_env.js';

const { startsWith } = lodash;

const authUser = 'user1';
const authPassword = 'password1';

const pluginSettings = {
    authRequired: true,
    authUser,
    authPassword,
};

const axiosConfig = {
    auth: {
        username: authUser,
        password: authPassword
    }
};

function makeRequest(config)
{
    const fullConfig = Object.assign({
        auth: false,
        validateStatus: () => true,
    }, config);

    return client.handler.axios.get('api/player', fullConfig);
}

describe('authentication', () => {
    usePlayer({ pluginSettings, axiosConfig });

    test('require auth', async () => {
        const response = await makeRequest();

        assert.equal(response.status, 401);
        assert.ok(response.data && response.data.error);
        assert.ok(startsWith(response.headers['www-authenticate'], 'Basic'));
    });

    test('invalid auth', async () => {
        const response = await makeRequest({
            auth: { username: authUser, password: 'wrong' }
        });

        assert.equal(response.status, 401);
        assert.ok(response.data && response.data.error);
        assert.ok(startsWith(response.headers['www-authenticate'], 'Basic'));
    });

    test('valid auth', async () => {
        const response = await makeRequest({
            auth: { username: authUser, password: authPassword }
        });

        assert.equal(response.status, 200);
        assert.ok(response.data && response.data.player);
    });
});
