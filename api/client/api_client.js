'use strict';

const ErrorType = Object.freeze({
    none: 'none',
    unknown: 'unknown',
    internal: 'internal',
    invalidParam: 'invalidParam',
    invalidState: 'invalidState',
    notFound: 'notFound',
    accessDenied: 'accessDenied'
});

const SwitchParam = Object.freeze({
    toggle: 'toggle'
});

const PlaybackState = Object.freeze({
    stopped: 'stopped',
    playing: 'playing',
    paused: 'paused'
});

function skipUndefined(params)
{
    const result = {};

    for (let key of Object.keys(params))
    {
        const value = params[key];

        if (typeof value !== 'undefined')
            result[key] = value;
    }

    return result;
}

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
            const [ offset = 0, count = 1000 ] = arg.split(':', 2).map(v => parseInt(v));
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

    get(url, params)
    {
        return this.handler.get(
            url, params ? skipUndefined(params) : undefined);
    }

    post(url, data)
    {
        return this.handler.post(
            url, data ? skipUndefined(data) : undefined);
    }

    createEventSource(url, callback, params)
    {
        return this.handler.createEventSource(
            url, callback, params ? skipUndefined(params) : undefined);
    }

    getPlayerState(columns)
    {
        return this.get('api/player', { columns }).then(r => r.player);
    }

    setPlayerState(options)
    {
        return this.post('api/player', options);
    }

    setMuted(value)
    {
        return this.setPlayerState({ isMuted: value });
    }

    setVolume(value)
    {
        return this.setPlayerState({ volume: value });
    }

    setPlaybackPosition(value)
    {
        return this.setPlayerState({ position: value });
    }

    movePlaybackPosition(value)
    {
        return this.setPlayerState({ relativePosition: value });
    }

    setPlaybackMode(value)
    {
        return this.setPlayerState({ playbackMode: value });
    }

    play(plref, item)
    {
        return this.post(`api/player/play/${plref}/${item}`);
    }

    playCurrent()
    {
        return this.post('api/player/play');
    }

    playRandom()
    {
        return this.post('api/player/play/random');
    }

    stop()
    {
        return this.post('api/player/stop');
    }

    pause()
    {
        return this.post('api/player/pause');
    }

    togglePause()
    {
        return this.post('api/player/pause/toggle');
    }

    previous()
    {
        return this.post('api/player/previous');
    }

    next()
    {
        return this.post('api/player/next');
    }

    getPlaylists()
    {
        return this.get('api/playlists').then(r => r.playlists);
    }

    addPlaylist(options)
    {
        return this.post('api/playlists/add', options);
    }

    removePlaylist(plref)
    {
        return this.post(`api/playlists/remove/${plref}`);
    }

    movePlaylist(plref, index)
    {
        return this.post(`api/playlists/move/${plref}/${index}`);
    }

    removePlaylist(plref)
    {
        return this.post(`api/playlists/remove/${plref}`);
    }

    clearPlaylist(plref)
    {
        return this.post(`api/playlists/${plref}/clear`)
    }

    renamePlaylist(plref, title)
    {
        return this.post(`api/playlists/${plref}`, { title });
    }

    setCurrentPlaylist(plref)
    {
        return this.post('api/playlists', { current: plref });
    }

    getPlaylistItems(plref, columns, range)
    {
        const { offset, count } = parseRange(range);
        const url = `api/playlists/${plref}/items/${offset}:${count}`;
        return this.get(url, { columns }).then(r => r.playlistItems);
    }

    addPlaylistItems(plref, items, options)
    {
        const data = { items };

        if (options)
            Object.assign(data, options);

        return this.post(`api/playlists/${plref}/items/add`, data);
    }

    sortPlaylistItems(plref, options)
    {
        return this.post(`api/playlists/${plref}/items/sort`, options);
    }

    removePlaylistItems(plref, items)
    {
        return this.post(`api/playlists/${plref}/items/remove`, { items });
    }

    copyPlaylistItems(options)
    {
        const data = {
            items: options.items,
            targetIndex: options.targetIndex
        };

        if (isTransferBetweenPlaylists(options))
        {
            return this.post(
                `api/playlists/${options.from}/${options.to}/items/copy`, data);
        }
        else
        {
            return this.post(
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
            return this.post(
                `api/playlists/${options.from}/${options.to}/items/move`, data);
        }
        else
        {
            return this.post(
                `api/playlists/${options.playlist}/items/move`, data);
        }
    }

    getFileSystemRoots()
    {
        return this.get('api/browser/roots').then(r => r.roots);
    }

    getFileSystemEntries(path)
    {
        return this.get('api/browser/entries', { path }).then(r => r.entries);
    }

    getArtwork(query)
    {
        return this.get('api/artwork', query);
    }

    query(options)
    {
        return this.get('api/query', formatQueryOptions(options));
    }

    queryEvents(options, callback)
    {
        return this.createEventSource(
            'api/query/events', callback, options);
    }

    queryUpdates(options, callback)
    {
        return this.createEventSource(
            'api/query/updates', callback, formatQueryOptions(options));
    }
}

module.exports = {
    ErrorType,
    SwitchParam,
    PlaybackState,
    ApiClient,
};
