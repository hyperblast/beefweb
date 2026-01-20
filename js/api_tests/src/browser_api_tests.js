import path from 'path';
import fs from 'fs';
import { omit, sortBy } from 'lodash';
import { describe, test, assert } from 'vitest';
import { client, config, usePlayer } from './test_env.js';

const readdir = fs.promises.readdir;
const stat = fs.promises.stat;

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

describe('browser api', () => {
    usePlayer();

    test('get roots', async () => {
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

    test('get entries root', async () => {
        const result = await client.getFileSystemEntries(config.musicDir);
        const expected = await getFileSystemEntriesDirect(config.musicDir);
        const actual = normalizeResult(result.entries);

        assert.ok(isPathSeparator(result.pathSeparator));
        assert.deepEqual(actual, expected);
    });

    test('get entries subdir', async () => {
        const result = await client.getFileSystemEntries(musicSubdir);
        const expected = await getFileSystemEntriesDirect(musicSubdir);
        const actual = normalizeResult(result.entries);

        assert.ok(isPathSeparator(result.pathSeparator));
        assert.deepEqual(actual, expected);
    });
});