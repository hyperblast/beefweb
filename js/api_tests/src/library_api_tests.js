import { describe, test, assert } from 'vitest';
import { client, config, setupPlayer } from './test_env.js';
import { PlayerId } from './test_context.js';

const isSupported = config.playerId === PlayerId.foobar2000;

describe('library api', () => {
    setupPlayer();

    test('get library info', async () => {
        const info = await client.getLibraryInfo();

        assert.equal(info.supported, isSupported);
        assert.equal(typeof info.enabled, 'boolean');
        assert.equal(typeof info.itemCount, 'number');
    });

    test('get library items', async () => {
        if (!isSupported)
        {
            const response = await client.handler.axios.get(
                '/api/library/items',
                { params: { columns: ['%path%'] }, validateStatus: () => true });

            assert.equal(response.status, 501);
            return;
        }

        const result = await client.getLibraryItems(['%path%', '%title%'], { offset: 0, count: 100 });

        assert.equal(result.offset, 0);
        assert.equal(typeof result.totalCount, 'number');
        assert.ok(Array.isArray(result.items));

        for (const item of result.items)
        {
            assert.equal(item.columns.length, 2);
            assert.equal(typeof item.path, 'string');
            assert.equal(typeof item.subsong, 'number');
        }
    });

    test('browse library folders', async () => {
        if (!isSupported)
            return;

        const result = await client.getLibraryItemsByPath('', ['%title%'], { offset: 0, count: 100 });

        assert.equal(result.offset, 0);
        assert.equal(typeof result.totalCount, 'number');
        assert.ok(Array.isArray(result.items));

        // Top level has nowhere to navigate up to
        assert.equal(result.path, '');
        assert.equal(result.parentPath, undefined);

        for (const item of result.items)
        {
            assert.ok(item.type === 'D' || item.type === 'F');
            assert.ok(typeof item.name === 'string');
            assert.ok(typeof item.path === 'string');
        }
    });

    test('library artwork for missing item', async () => {
        for (const folderImage of [false, true])
        {
            const response = await client.handler.axios.get(
                '/api/artwork/library',
                { params: { path: 'no/such/folder', folderImage }, validateStatus: () => true });

            assert.equal(response.status, isSupported ? 404 : 501);
        }
    });

    test('add library items to playlist', async () => {
        if (!isSupported)
            return;

        const playlist = await client.addPlaylist({ title: 'library add test' });

        // Library is empty in tests, adding everything must still succeed and change nothing
        await client.addPlaylistItemsFromLibrary(playlist.id, { items: [''] });

        // Explicitly referenced items resolve to nothing for the same reason
        await client.addPlaylistItemsFromLibrary(
            playlist.id, { items: [{ path: 'no/such/track.flac', subsong: 0 }] });

        const items = await client.getPlaylistItems(playlist.id, ['%path%'], { offset: 0, count: 100 });
        assert.equal(items.totalCount, 0);
    });

    test('reject add without items or query', async () => {
        const response = await client.handler.axios.post(
            '/api/playlists/0/items/add-from-library', {}, { validateStatus: () => true });

        assert.equal(response.status, isSupported ? 400 : 501);
    });

    test('reject range without count', async () => {
        const response = await client.handler.axios.get(
            '/api/library/items',
            { params: { columns: ['%title%'], range: '100' }, validateStatus: () => true });

        assert.equal(response.status, isSupported ? 400 : 501);
    });

    test('browse by columns', async () => {
        if (!isSupported)
        {
            const response = await client.handler.axios.get(
                '/api/library/items/by-columns',
                { params: { columns: ['%title%'], groupBy: '%artist%|%title%' }, validateStatus: () => true });

            assert.equal(response.status, 501);
            return;
        }

        const root = await client.getLibraryItemsByColumns('%artist%|%title%', '', ['%title%']);

        assert.equal(root.offset, 0);
        assert.equal(root.group, '');
        assert.equal(root.parentGroup, undefined);
        assert.ok(Array.isArray(root.items));

        const nested = await client.getLibraryItemsByColumns('%artist%|%title%', 'Some Artist', ['%title%']);

        assert.equal(nested.group, 'Some Artist');
        assert.equal(nested.parentGroup, '');
    });

    test('browse by columns requires grouping pattern', async () => {
        const response = await client.handler.axios.get(
            '/api/library/items/by-columns',
            { params: { columns: ['%title%'] }, validateStatus: () => true });

        assert.equal(response.status, isSupported ? 400 : 501);
    });

    test('browse by path requires supported player', async () => {
        const response = await client.handler.axios.get(
            '/api/library/items/by-path',
            { params: { columns: ['%title%'] }, validateStatus: () => true });

        assert.equal(response.status, isSupported ? 200 : 501);
    });

    test('get library items with query', async () => {
        if (!isSupported)
            return;

        const result = await client.getLibraryItems(
            ['%path%'],
            { offset: 0, count: 100 },
            { query: 'artist HAS beefweb_no_such_artist' });

        assert.equal(result.totalCount, 0);
        assert.deepEqual(result.items, []);
    });
});
