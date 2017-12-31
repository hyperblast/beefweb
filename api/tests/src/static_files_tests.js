'use strict';

const q = require('qunit');
const { client, moduleHooks } = require('./test_context');

q.module('static files', moduleHooks);

function getFile(url, config)
{
    return client.handler.axios.get(url, config);
}

q.test('get index', async assert =>
{
    const result = await getFile('');
    assert.equal(result.data, 'index.html\n');
});

q.test('get file', async assert =>
{
    const result = await getFile('file.html');
    assert.equal(result.data, 'file.html\n');
});

q.test('get subdir index', async assert =>
{
    const result = await getFile('subdir/');
    assert.equal(result.data, 'subdir/index.html\n');
});

q.test('get subdir file', async assert =>
{
    const result = await getFile('subdir/file.html');
    assert.equal(result.data, 'subdir/file.html\n');
});

q.test('provide content type', async assert =>
{
    const contentTypes = {
        'file.html': 'text/html',
        'file.htm': 'text/html',
        'file.css': 'text/css',
        'file.svg': 'image/svg+xml',
        'file.js': 'application/javascript',
        'file.png': 'image/png',
        'file.jpeg': 'image/jpeg',
        'file.jpg': 'image/jpeg',
    };

    for (let file of Object.getOwnPropertyNames(contentTypes))
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

    const cachedResult = await getFile('file.html', {
        headers: { 'If-None-Match': etag },
        validateStatus: () => true,
    });

    assert.equal(cachedResult.status, 304);
});
