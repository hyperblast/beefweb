'use strict';

const path = require('path');
const q = require('qunit');
const { client, moduleHooks, musicDir, tracks } = require('./test_context');

q.module('browser api', moduleHooks);

q.test('get roots', async assert =>
{
    const roots = await client.getRoots();

    assert.deepEqual(roots.map(r => r.path), [musicDir]);
});

q.test('get entries root', async assert =>
{
    const entries = await client.getEntries(musicDir);
    const paths = entries.map(r => r.path);

    paths.sort();

    assert.deepEqual(paths, [
        path.join(musicDir, 'subdir'),
        tracks.t1,
        tracks.t2
    ]);
});

q.test('get entries subdir', async assert =>
{
    const entries = await client.getEntries(path.join(musicDir, 'subdir'));
    const paths = entries.map(r => r.path);

    assert.deepEqual(paths, [tracks.t3]);
});