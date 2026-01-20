import path from 'path';
import fs from 'fs';
import { describe, test, assert } from 'vitest';
import { client, config, tracks, usePlayer } from './test_env.js';

const readFile = fs.promises.readFile;

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

describe('artwork 1', () => {
    usePlayer();

    test('get from folder', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.waitPlaybackMetadata();

        const expected = await getFile('cover.png');
        const response = await getArtwork(0, 0);

        assert.equal(response.status, 200);
        assert.equal(response.headers['content-type'], 'image/png');
        assert.ok(response.data.equals(expected));
    });

    test('get current', async () => {
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
});

describe('artwork 2', () => {
    usePlayer();

    test('get from tag', async () => {
        await client.addPlaylistItems(0, [tracks.t2Alt]);
        await client.waitPlaybackMetadata();

        const expected = await getFile('cover-white.png.hidden');
        const response = await getArtwork(0, 0);

        assert.equal(response.status, 200);
        assert.equal(response.headers['content-type'], 'image/png');
        assert.ok(response.data.equals(expected));
    });
});

describe('artwork 3', () => {
    usePlayer();

    test('missing', async () => {
        await client.addPlaylistItems(0, [tracks.t3]);
        await client.waitPlaybackMetadata();

        const response = await getArtwork(0, 0);
        assert.equal(response.status, 404);
    });
});
