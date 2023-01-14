import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import q from 'qunit';
import lodash from 'lodash';
import context  from './test_context.js';

const { client, config, usePlayer } = context;
const { omit, sortBy } = lodash;

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const musicSubdir = path.join(config.musicDir, 'subdir');

function normalizeResult(result)
{
    return sortBy(
        result.map(r => omit(r, ['timestamp', 'size'])),
        ['type', 'path']
    );
}

function isPathSeparator(str)
{
    return str === '/' || str === '\\';
}

async function getFileSystemEntriesDirect(dirPath)
{
    const names = await readdir(dirPath);
    const items = [];

    for (const name of names)
    {
        const itemPath = path.join(dirPath, name);
        const stats = await stat(itemPath);

        let type;

        if (stats.isDirectory())
            type = 'D'
        else if (stats.isFile())
            type = 'F'
        else
            continue;

        items.push({ path: itemPath, name, type });
    }

    return sortBy(items, ['type', 'path']);
}

q.module('browser api', usePlayer());

q.test('get roots', async assert =>
{
    const result = await client.getFileSystemRoots()
    const actual = normalizeResult(result.roots);
    const expected = [{
        name: config.musicDir,
        path: config.musicDir,
        type: 'D',
    }];

    assert.ok(isPathSeparator(result.pathSeparator));
    assert.deepEqual(actual, expected);
});

q.test('get entries root', async assert =>
{
    const result = await client.getFileSystemEntries(config.musicDir);
    const expected = await getFileSystemEntriesDirect(config.musicDir);
    const actual = normalizeResult(result.entries);

    assert.ok(isPathSeparator(result.pathSeparator));
    assert.deepEqual(actual, expected);
});

q.test('get entries subdir', async assert =>
{
    const result = await client.getFileSystemEntries(musicSubdir);
    const expected = await getFileSystemEntriesDirect(musicSubdir);
    const actual = normalizeResult(result.entries);

    assert.ok(isPathSeparator(result.pathSeparator));
    assert.deepEqual(actual, expected);
});
