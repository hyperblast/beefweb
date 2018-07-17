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

function getArtwork(playlist, item)
{
    return client.handler.axios.get(`api/artwork/${playlist}/${item}`, {
        responseType: 'arraybuffer',
        validateStatus: () => true,
    });
}

q.module('artwork 1', usePlayer());

q.test('get from folder', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);

    const expected = await getFile('cover-black.png');
    const response = await getArtwork(0, 0);

    assert.equal(response.status, 200);
    assert.ok(response.data.equals(expected));
});

q.module('artwork 2', usePlayer());

q.test('get from tag', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2]);

    const expected = await getFile('cover-white.png.hidden');
    const response = await getArtwork(0, 0);

    assert.equal(response.status, 200);
    assert.ok(response.data.equals(expected));
});

q.module('artwork 3', usePlayer());

q.test('missing', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);
    const response = await getArtwork(0, 0);
    assert.equal(response.status, 404);
});
