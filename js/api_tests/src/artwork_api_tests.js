import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import q from 'qunit';
import { client, config, tracks, usePlayer } from './test_env.js';

const readFile = promisify(fs.readFile);

function getFile(name)
{
    return readFile(path.join(config.musicDir, name));
}

function getCurrentArtwork()
{
    return client.handler.axios.get('api/artwork/current', {
        responseType: 'arraybuffer',
        validateStatus: () => true,
    });
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
    await client.waitPlaybackMetadata();

    const expected = await getFile('cover.png');
    const response = await getArtwork(0, 0);

    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'image/png');
    assert.ok(response.data.equals(expected));
});

q.test('get current', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t1]);
    await client.play(0, 0);
    await client.waitForState('playing');
    await client.waitPlaybackMetadata();

    const expected = await getFile('cover.png');
    const response = await getCurrentArtwork();

    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'image/png');
    assert.ok(response.data.equals(expected));
});

q.module('artwork 2', usePlayer());

q.test('get from tag', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t2Alt]);
    await client.waitPlaybackMetadata();

    const expected = await getFile('cover-white.png.hidden');
    const response = await getArtwork(0, 0);

    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'image/png');
    assert.ok(response.data.equals(expected));
});

q.module('artwork 3', usePlayer());

q.test('missing', async assert =>
{
    await client.addPlaylistItems(0, [tracks.t3]);
    await client.waitPlaybackMetadata();

    const response = await getArtwork(0, 0);
    assert.equal(response.status, 404);
});
