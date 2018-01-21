'use strict';

const path = require('path');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const q = require('qunit');

const { client, usePlayer, config, tracks } = require('./test_context');

function getFile(name)
{
    return readFile(path.join(config.musicDir, name), null);
}

function getArtwork(params)
{
    return client.handler.axios.get('api/artwork', {
        responseType: 'arraybuffer',
        validateStatus: () => true,
        params,
    });
}

q.module('artwork', usePlayer());

q.test('get from folder', async assert =>
{
    const expected = await getFile('cover-black.png');
    const response = await getArtwork({ file: tracks.t1 });

    assert.equal(response.status, 200);
    assert.ok(response.data.equals(expected));
});

q.test('get from tag', async assert =>
{
    const expected = await getFile('cover-white.png.hidden');
    const response = await getArtwork({ file: tracks.t2 });

    assert.equal(response.status, 200);
    assert.ok(response.data.equals(expected));
});

q.test('missing', async assert =>
{
    const response = await getArtwork({ file: tracks.t3 });
    assert.equal(response.status, 404);
});
