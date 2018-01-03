'use strict';

const q = require('qunit');
const startsWith = require('lodash/startsWith');
const { client, usePlayer } = require('./test_context');

const authUser = 'user1';
const authPassword = 'password1';

const playerSettings = {
    'beefweb.auth_required': 1,
    'beefweb.auth_user': authUser,
    'beefweb.auth_password': authPassword,
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

q.module('authentication', usePlayer({ playerSettings, axiosConfig }));

q.test('require auth', async assert => {
    const response = await makeRequest();

    assert.equal(response.status, 401);
    assert.ok(response.data && response.data.error);
    assert.ok(startsWith(response.headers['www-authenticate'], 'Basic'));
});

q.test('invalid auth', async assert => {
    const response = await makeRequest({
        auth: { username: authUser, password: 'wrong' }
    });

    assert.equal(response.status, 401);
    assert.ok(response.data && response.data.error);
    assert.ok(startsWith(response.headers['www-authenticate'], 'Basic'));
});

q.test('valid auth', async assert => {
    const response = await makeRequest({
        auth: { username: authUser, password: authPassword }
    });

    assert.equal(response.status, 200);
    assert.ok(response.data && response.data.player);
});
