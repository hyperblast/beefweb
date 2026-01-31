import path from 'path';
import fs from 'fs';
import { describe, test, assert } from 'vitest';
import { client, config, setupPlayer } from './test_env.js';

const readFile = fs.promises.readFile;

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

function getFile(url, config)
{
    return client.handler.axios.get(url, config);
}

function getFileData(url)
{
    return readFile(path.join(config.webRootDir, url), 'utf8');
}

describe('static files', () => {
    setupPlayer({ pluginSettings, axiosConfig });

    test('get index of root', async () => {
        const result = await getFile('/');
        assert.equal(result.data, 'index.html\n');
    });

    test('get index of prefix', async () => {
        const result = await getFile('/prefix/');
        assert.equal(result.data, 'index.html\n');
    });

    test('get index of nested prefix', async () => {
        const result = await getFile('/prefix/nested/');
        assert.equal(result.data, 'index.html\n');
    });

    test('redirect index of prefix', async () => {
        const result = await getFile('/prefix');
        assert.equal(result.headers["location"], '/prefix/');
    });

    test('redirect index of nested prefix', async () => {
        const result = await getFile('/prefix/nested');
        assertRedirect(assert, result, '/prefix/nested/');
    });

    test('get file of root', async () => {
        const result = await getFile('/file.html');
        assert.equal(result.data, 'file.html\n');
    });

    test('get file of prefix', async () => {
        const result = await getFile('/prefix/file.html');
        assert.equal(result.data, 'file.html\n');
    });

    test('get file of nested prefix', async () => {
        const result = await getFile('/prefix/nested/file.html');
        assert.equal(result.data, 'file.html\n');
    });

    test('get subdir index of root', async () => {
        const result = await getFile('/subdir/');
        assert.equal(result.data, 'subdir/index.html\n');
    });

    test('get subdir index of prefix', async () => {
        const result = await getFile('/prefix/subdir/');
        assert.equal(result.data, 'subdir/index.html\n');
    });

    test('get subdir index of nested prefix', async () => {
        const result = await getFile('/prefix/nested/subdir/');
        assert.equal(result.data, 'subdir/index.html\n');
    });

    test('redirect subdir index of root', async () => {
        const result = await getFile('/subdir');
        assertRedirect(assert, result, '/subdir/');
    });

    test('redirect subdir index of prefix', async () => {
        const result = await getFile('/prefix/subdir');
        assertRedirect(assert, result, '/prefix/subdir/');
    });

    test('redirect subdir index of nested prefix', async () => {
        const result = await getFile('/prefix/nested/subdir');
        assertRedirect(assert, result, '/prefix/nested/subdir/');
    });

    test('get subdir file of root', async () => {
        const result = await getFile('/subdir/file.html');
        assert.equal(result.data, 'subdir/file.html\n');
    });

    test('get subdir file of prefix', async () => {
        const result = await getFile('/prefix/subdir/file.html');
        assert.equal(result.data, 'subdir/file.html\n');
    });

    test('get subdir file of nested prefix', async () => {
        const result = await getFile('/prefix/nested/subdir/file.html');
        assert.equal(result.data, 'subdir/file.html\n');
    });

    test('get file of alt root', async () => {
        const result = await getFile('/extra.html');
        assert.equal(result.data, 'extra.html\n');
    });

    test('get subdir index of alt root', async () => {
        const result = await getFile('/altsubdir/');
        assert.equal(result.data, 'altsubdir/index.html\n');
    });

    test('get subdir file of alt root', async () => {
        const result = await getFile('/altsubdir/index.html');
        assert.equal(result.data, 'altsubdir/index.html\n');
    });

    test('redirect subdir index of alt root', async () => {
        const result = await getFile('/altsubdir');
        assertRedirect(assert, result, '/altsubdir/');
    });

    test('provide content type', async () => {
        const contentTypes = {
            'file.html': 'text/html; charset=utf-8',
            'file.htm': 'text/html; charset=utf-8',
            'file.css': 'text/css',
            'file.svg': 'image/svg+xml',
            'file.js': 'application/javascript',
            'file.png': 'image/png',
            'file.jpeg': 'image/jpeg',
            'file.jpg': 'image/jpeg',
            'file.txt': 'text/plain; charset=utf-8',
        };

        for (let file in contentTypes)
        {
            const result = await getFile(file);
            assert.equal(result.status, 200, 'invalid http status for ' + file);
            assert.equal(result.headers['content-type'], contentTypes[file], 'invalid content type for ' + file);
        }
    });

    test('etag support', async () => {
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

    test('enable compression', async () => {
        const expectedData = await getFileData('large.txt');
        const result = await getFile('large.txt', {
            headers: { 'Accept-Encoding': 'whatever, gzip' },
        });

        assert.equal(result.data, expectedData);

        const contentLength = parseInt(result.headers['content-length']);
        assert.ok(contentLength < expectedData.length);
    });

    test('disable compression', async () => {
        const expectedData = await getFileData('large.txt');
        const result = await getFile('large.txt', {
            headers: { 'Accept-Encoding': 'whatever' },
        });

        assert.equal(result.data, expectedData);

        const contentLength = parseInt(result.headers['content-length']);
        assert.equal(contentLength, expectedData.length);
    });

    test('get via parent directory', async () => {
        const expectedData = await getFileData('file.txt');

        const result1 = await getFile('/test/../file.txt');
        assert.equal(result1.data, expectedData);

        const result2 = await getFile('/test/%2E%2E/file.txt');
        assert.equal(result2.data, expectedData);
    });

    test('get non-existing file', async () => {
        const result = await getFile('/non-existing.html', ignoreStatus);
        assert.equal(result.status, 404);
    });

    test('escape root dir', async () => {
        const result0 = await getFile('/../../../../../../../etc/passwd', ignoreStatus);
        assert.equal(result0.status, 400);

        const result1 = await getFile('/../package.json', ignoreStatus);
        assert.equal(result1.status, 400);

        const result2 = await getFile('/%2E%2E/package.json', ignoreStatus);
        assert.equal(result2.status, 400);

        const result3 = await getFile('/prefix/../package.json', ignoreStatus);
        assert.equal(result3.status, 400);

        const result4 = await getFile('/prefix/%2E%2E/package.json', ignoreStatus);
        assert.equal(result4.status, 400);

        const result5 = await getFile('/prefix/nested/../package.json', ignoreStatus);
        assert.equal(result5.status, 400);

        const result6 = await getFile('/prefix/nested/%2E%2E/package.json', ignoreStatus);
        assert.equal(result6.status, 400);
    });
});
