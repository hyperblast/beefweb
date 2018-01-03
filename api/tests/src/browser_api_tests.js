'use strict';

const path = require('path');
const q = require('qunit');
const omit = require('lodash/omit');
const sortBy = require('lodash/sortBy');

const { client, usePlayer, config, tracks } = require('./test_context');

const musicSubdir = path.join(config.musicDir, 'subdir');

function normalizeResult(result)
{
    return sortBy(
        result.map(r => omit(r, ['timestamp', 'size'])),
        ['type', 'path']
    );
}

q.module('browser api', usePlayer());

q.test('get roots', async assert =>
{
    const result = normalizeResult(await client.getFileSystemRoots());

    assert.deepEqual(result, [{
        name: config.musicDir,
        path: config.musicDir,
        type: 'D',
    }]);
});

q.test('get entries root', async assert =>
{
    const result = normalizeResult(await client.getFileSystemEntries(config.musicDir));

    assert.deepEqual(result, [
        {
            name: path.basename(musicSubdir),
            path: musicSubdir,
            type: 'D',
        },
        {
            name: path.basename(tracks.t1),
            path: tracks.t1,
            type: 'F',
        },
        {
            name: path.basename(tracks.t2),
            path: tracks.t2,
            type: 'F',
        },
    ]);
});

q.test('get entries subdir', async assert =>
{
    const result = normalizeResult(await client.getFileSystemEntries(musicSubdir));

    assert.deepEqual(result, [{
        name: path.basename(tracks.t3),
        path: tracks.t3,
        type: 'F',
    }]);
});
