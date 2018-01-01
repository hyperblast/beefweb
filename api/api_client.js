'use strict';

function formatRange(range)
{
    return `${range.offset}:${range.count}`;
}

function parseRange(arg)
{
    switch (typeof arg)
    {
        case 'number':
            return { offset: arg, count: 1000 };

        case 'string':
        {
            const [ offset = 0, count = 1000 ] = arg.split(':', 2).map(parseInt);
            return { offset, count };
        }

        case 'object':
        {
            const { offset = 0, count = 1000 } = arg;
            return { offset, count };
        }

        default:
            return { offset: 0, count: 1000 };
    }
}

function formatQueryOptions(arg)
{
    if (arg.playlistItems)
    {
        const plrange = formatRange(parseRange(arg.plrange));
        return Object.assign({}, arg, { plrange });
    }
    else
        return arg;
}

function isTransferBetweenPlaylists(options)
{
    const { playlist, from, to } = options;

    const hasPlaylist = typeof playlist !== 'undefined';
    const hasFromTo = typeof from !== 'undefined' && typeof to !== 'undefined';

    if (hasPlaylist === hasFromTo)
        throw Error("Either 'playlist' or 'from' and 'to' options are required");

    return hasFromTo;
}

class ApiClient
{
    constructor(handler)
    {
        this.handler = handler;
    }

    getPlayerState(columns)
    {
        return this.handler.get('api/player', { columns }).then(r => r.player);
    }

    setPlayerState(options)
    {
        return this.handler.post('api/player', options);
    }

    play(plref, item)
    {
        return this.handler.post(`api/player/play/${plref}/${item}`);
    }

    playCurrent()
    {
        return this.handler.post('api/player/play');
    }

    playRandom()
    {
        return this.handler.post('api/player/play/random');
    }

    stop()
    {
        return this.handler.post('api/player/stop');
    }

    pause()
    {
        return this.handler.post('api/player/pause');
    }

    togglePause()
    {
        return this.handler.post('api/player/pause/toggle');
    }

    previous()
    {
        return this.handler.post('api/player/previous');
    }

    next()
    {
        return this.handler.post('api/player/next');
    }

    getPlaylists()
    {
        return this.handler.get('api/playlists').then(r => r.playlists);
    }

    addPlaylist(options)
    {
        return this.handler.post('api/playlists/add', options);
    }

    removePlaylist(plref)
    {
        return this.handler.post(`api/playlists/remove/${plref}`);
    }

    movePlaylist(plref, index)
    {
        return this.handler.post(`api/playlists/move/${plref}/${index}`);
    }

    removePlaylist(plref)
    {
        return this.handler.post(`api/playlists/remove/${plref}`);
    }

    clearPlaylist(plref)
    {
        return this.handler.post(`api/playlists/${plref}/clear`)
    }

    renamePlaylist(plref, title)
    {
        return this.handler.post(`api/playlists/${plref}`, { title });
    }

    setCurrentPlaylist(plref)
    {
        return this.handler.post('api/playlists', { current: plref });
    }

    getPlaylistItems(plref, columns, range)
    {
        const { offset, count } = parseRange(range);
        const url = `api/playlists/${plref}/items/${offset}:${count}`;
        return this.handler.get(url, { columns }).then(r => r.playlistItems);
    }

    addPlaylistItems(plref, items, options)
    {
        const data = { items };

        if (options)
            Object.assign(data, options);

        return this.handler.post(
            `api/playlists/${plref}/items/add`, data);
    }

    sortPlaylistItems(plref, options)
    {
        return this.handler.post(
            `api/playlists/${plref}/items/sort`, options);
    }

    removePlaylistItems(plref, items)
    {
        return this.handler.post(
            `api/playlists/${plref}/items/remove`, { items });
    }

    copyPlaylistItems(options)
    {
        const data = {
            items: options.items,
            targetIndex: options.targetIndex
        };

        if (isTransferBetweenPlaylists(options))
        {
            return this.handler.post(
                `api/playlists/${options.from}/${options.to}/items/copy`, data);
        }
        else
        {
            return this.handler.post(
                `api/playlists/${options.playlist}/items/copy`, data);
        }
    }

    movePlaylistItems(options)
    {
        const data = {
            items: options.items,
            targetIndex: options.targetIndex
        };

        if (isTransferBetweenPlaylists(options))
        {
            return this.handler.post(
                `api/playlists/${options.from}/${options.to}/items/move`, data);
        }
        else
        {
            return this.handler.post(
                `api/playlists/${options.playlist}/items/move`, data);
        }
    }

    getFileSystemRoots()
    {
        return this.handler.get('api/browser/roots').then(r => r.roots);
    }

    getFileSystemEntries(path)
    {
        return this.handler.get('api/browser/entries', { path }).then(r => r.entries);
    }

    query(options)
    {
        return this.handler.get('api/query', formatQueryOptions(options));
    }

    queryEvents(options, callback)
    {
        return this.handler.createEventSource(
            'api/query/events', callback, options);
    }

    queryUpdates(options, callback)
    {
        return this.handler.createEventSource(
            'api/query/updates', callback, formatQueryOptions(options));
    }
}

module.exports = ApiClient;
