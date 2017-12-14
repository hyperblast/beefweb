import RequestHandler from './request_handler'

export const ErrorType = Object.freeze({
    none: 'none',
    unknown: 'unknown',
    internal: 'internal',
    invalidParam: 'invalidParam',
    invalidState: 'invalidState',
    notFound: 'notFound',
    accessDenied: 'accessDenied'
});

export const SwitchParam = Object.freeze({
    toggle: 'toggle'
});

export const PlaybackState = Object.freeze({
    stopped: 'stopped',
    playing: 'playing',
    paused: 'paused'
});

export const LoopMode = Object.freeze({
    none: 'none',
    single: 'single',
    all: 'all'
});

export const PlaybackOrder = Object.freeze({
    linear: 'linear',
    random: 'random',
    shuffleAlbums: 'shuffleAlbums',
    shuffleTracks: 'shuffleTracks'
});

function normalizeUrl(url)
{
    if (!url)
        return '/';

    return url.lastIndexOf('/') == url.length - 1 ? url : url + '/';
}

export default class Client
{
    constructor(baseUrl, handlerType)
    {
        this.handler = new (handlerType || RequestHandler)(normalizeUrl(baseUrl) + 'api');
    }

    on(event, func)
    {
        this.handler.on(event, func);
    }

    off(event, func)
    {
        this.handler.off(event, func);
    }

    play(plref, item)
    {
        var itemRef = plref !== undefined && item !== undefined ? `/${plref}/${item}` : '';

        return this.handler.post({
            path: 'player/play' + itemRef
        });
    }

    playRandom()
    {
        return this.handler.post({
            path: 'player/play/random'
        });
    }

    stop()
    {
        return this.handler.post({
            path: 'player/stop'
        });
    }

    next()
    {
        return this.handler.post({
            path: 'player/next'
        });
    }

    previous()
    {
        return this.handler.post({
            path: 'player/previous'
        });
    }

    pause()
    {
        return this.handler.post({
            path: 'player/pause'
        });
    }

    togglePause()
    {
        return this.handler.post({
            path: 'player/pause/toggle'
        });
    }

    setPlayerParams(params)
    {
        return this.handler.post({
            path: 'player',
            body: params
        });
    }

    setMuted(value)
    {
        return this.setPlayerParams({ isMuted: value });
    }

    setVolumeDb(value)
    {
        return this.setPlayerParams({ volumeDb: value });
    }

    setPlaybackPosition(value)
    {
        return this.setPlayerParams({ position: value });
    }

    setLoopMode(value)
    {
        return this.setPlayerParams({ loop: value });
    }

    setPlaybackOrder(value)
    {
        return this.setPlayerParams({ order: value });
    }

    query(params)
    {
        return this.handler.get({
            path: 'query',
            params: params
        });
    }

    subscribe(params, callback)
    {
        return this.handler.subscribe({
            path: 'query/updates',
            params: params,
            callback: callback
        });
    }

    getPlayerState()
    {
        return this.handler.get({
            path: 'player'
        });
    }

    getPlaylists()
    {
        return this.handler.get({
            path: 'playlists'
        });
    }

    addPlaylist(title, index = -1)
    {
        return this.handler.post({
            path: 'playlists/add',
            body: { title, index }
        });
    }

    movePlaylist(plref, newIndex)
    {
        return this.handler.post({
            path: `playlists/move/${plref}/${newIndex}`
        });
    }

    removePlaylist(plref)
    {
        return this.handler.post({
            path: `playlists/remove/${plref}`
        });
    }

    clearPlaylist(plref)
    {
        return this.handler.post({
            path: `playlists/${plref}/clear`
        })
    }

    renamePlaylist(plref, title)
    {
        return this.handler.post({
            path: `playlists/${plref}`,
            body: { title }
        });
    }

    setCurrentPlaylist(plref)
    {
        return this.handler.post({
            path: 'playlists',
            body: { current: plref }
        });
    }

    getPlaylistItems(playlist, columns, offset = 0, count = 1000)
    {
        return this.handler.get({
            path: `playlists/${playlist}/items/${offset}:${count}`,
            params: { columns }
        })
    }

    addPlaylistItems(playlist, items)
    {
        return this.handler.post({
            path: `playlists/${playlist}/items/add`,
            body: { items }
        });
    }

    getRoots()
    {
        return this.handler.get({
            path: 'browser/roots'
        });
    }

    getDirectoryEntries(path)
    {
        return this.handler.get({
            path: 'browser/entries',
            params: { path }
        });
    }
}
