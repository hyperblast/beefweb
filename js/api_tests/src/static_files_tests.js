import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import q from 'qunit';
import { client, config, usePlayer } from './test_env.js';

const readFile = promisify(fs.readFile);

const pluginSettings = {
    urlMappings: {
        '/prefix': config.webRootDir,
        '/prefix/nested': config.webRootDir,
    }
};

const axiosConfig = {
    maxRedirects: 0,
    validateStatus: s => s >= 200 && s <= 399
};

const ignoreStatus = {
    validateStatus: () => true,
};

function assertRedirect(assert, result, location)
{
    assert.equal(result.status, 307);
    assert.equal(result.headers["location"], location);
}

q.module('static files', usePlayer({ pluginSettings, axiosConfig }));

function getFile(url, config)
{
    return client.handler.axios.get(url, config);
}

function getFileData(url)
{
   return readFile(path.join(config.webRootDir, url), 'utf8');
}

q.test('get index of root', async assert =>
{
    const result = await getFile('/');
    assert.equal(result.data, 'index.html\n');
});

q.test('get index of prefix', async assert =>
{
    const result = await getFile('/prefix/');
    assert.equal(result.data, 'index.html\n');
});

q.test('get index of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested/');
    assert.equal(result.data, 'index.html\n');
});

q.test('redirect index of prefix', async assert =>
{
    const result = await getFile('/prefix');
    assert.equal(result.headers["location"], '/prefix/');
});

q.test('redirect index of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested');
    assertRedirect(assert, result, '/prefix/nested/');
});

q.test('get file of root', async assert =>
{
    const result = await getFile('/file.html');
    assert.equal(result.data, 'file.html\n');
});

q.test('get file of prefix', async assert =>
{
    const result = await getFile('/prefix/file.html');
    assert.equal(result.data, 'file.html\n');
});

q.test('get file of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested/file.html');
    assert.equal(result.data, 'file.html\n');
});

q.test('get subdir index of root', async assert =>
{
    const result = await getFile('/subdir/');
    assert.equal(result.data, 'subdir/index.html\n');
});

q.test('get subdir index of prefix', async assert =>
{
    const result = await getFile('/prefix/subdir/');
    assert.equal(result.data, 'subdir/index.html\n');
});

q.test('get subdir index of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested/subdir/');
    assert.equal(result.data, 'subdir/index.html\n');
});

q.test('redirect subdir index of root', async assert =>
{
    const result = await getFile('/subdir');
    assertRedirect(assert, result, '/subdir/');
});

q.test('redirect subdir index of prefix', async assert =>
{
    const result = await getFile('/prefix/subdir');
    assertRedirect(assert, result, '/prefix/subdir/');
});

q.test('redirect subdir index of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested/subdir');
    assertRedirect(assert, result, '/prefix/nested/subdir/');
});

q.test('get subdir file of root', async assert =>
{
    const result = await getFile('/subdir/file.html');
    assert.equal(result.data, 'subdir/file.html\n');
});

q.test('get subdir file of prefix', async assert =>
{
    const result = await getFile('/prefix/subdir/file.html');
    assert.equal(result.data, 'subdir/file.html\n');
});

q.test('get subdir file of nested prefix', async assert =>
{
    const result = await getFile('/prefix/nested/subdir/file.html');
    assert.equal(result.data, 'subdir/file.html\n');
});

q.test('provide content type', async assert =>
{
    const contentTypes = {
        'file.html': 'text/html; charset=utf-8',
        'file.htm': 'text/html; charset=utf-8',
        'file.css': 'text/css',
        'file.svg': 'image/svg+xml',
        'file.js': 'application/javascript',
        'file.png': 'image/png',
        'file.jpeg': 'image/jpeg',
        'file.jpg': 'image/jpeg',
        'file.webp': 'image/webp',
        'file.txt': 'text/plain; charset=utf-8',
    };

    for (let file of Object.keys(contentTypes))
    {
        const result = await getFile(file);
        assert.equal(result.headers['content-type'], contentTypes[file]);
    }
});

q.test('etag support', async assert =>
{
    const initialResult = await getFile('file.html');

    const etag = initialResult.headers['etag'];
    assert.ok(etag);

    const cacheControl = initialResult.headers['cache-control'];
    assert.equal(cacheControl, 'max-age=3, must-revalidate');

    const cachedResult = await getFile('file.html', {
        headers: { 'If-None-Match': etag },
        validateStatus: () => true,
    });

    assert.equal(cachedResult.status, 304);
    assert.equal(cachedResult.headers['etag'], etag);
    assert.equal(cachedResult.headers['cache-control'], cacheControl);
});

q.test('enable compression', async assert =>
{
    const expectedData = await getFileData('large.txt');
    const result = await getFile('large.txt', {
        headers: { 'Accept-Encoding': 'whatever, gzip' },
    });

    assert.equal(result.data, expectedData);

    const contentLength = parseInt(result.headers['content-length']);
    assert.ok(contentLength < expectedData.length);
});

q.test('disable compression', async assert =>
{
    const expectedData = await getFileData('large.txt');
    const result = await getFile('large.txt', {
        headers: { 'Accept-Encoding': 'whatever' },
    });

    assert.equal(result.data, expectedData);

    const contentLength = parseInt(result.headers['content-length']);
    assert.equal(contentLength, expectedData.length);
});

q.test('get via parent directory', async assert =>
{
    const expectedData = await getFileData('file.txt');

    const result1 = await getFile('/test/../file.txt');
    assert.equal(result1.data, expectedData);

    const result2 = await getFile('/test/%2E%2E/file.txt');
    assert.equal(result2.data, expectedData);
});

q.test('get non-existing file', async assert =>
{
    const result = await getFile('/non-existing.html', ignoreStatus);
    assert.equal(result.status, 404);
});

q.test('escape root dir', async assert =>
{
    const result1 = await getFile('/../package.json', ignoreStatus);
    assert.equal(result1.status, 404);

    const result2 = await getFile('/%2E%2E/package.json', ignoreStatus);
    assert.equal(result2.status, 404);

    const result3 = await getFile('/prefix/../package.json', ignoreStatus);
    assert.equal(result3.status, 404);

    const result4 = await getFile('/prefix/%2E%2E/package.json', ignoreStatus);
    assert.equal(result4.status, 404);

    const result5 = await getFile('/prefix/nested/../package.json', ignoreStatus);
    assert.equal(result3.status, 404);

    const result6 = await getFile('/prefix/nested/%2E%2E/package.json', ignoreStatus);
    assert.equal(result4.status, 404);
});
