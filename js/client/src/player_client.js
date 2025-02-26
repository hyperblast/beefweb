import {
    skipUndefined,
    formatRange,
    parseRange,
    formatQueryOptions,
    isTransferBetweenPlaylists
} from './utils.js'

export default class PlayerClient
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

    setPlayerState(newState)
    {
        return this.post('api/player', newState);
    }

    setMuted(value)
    {
        return this.setPlayerState({ isMuted: value });
    }

    setVolume(value)
    {
        return this.setPlayerState({ volume: value });
    }

    setVolumeRelative(value)
    {
        return this.setPlayerState({ relativeVolume: value });
    }

    volumeUp()
    {
        return this.post('api/player/volume/up');
    }

    volumeDown()
    {
        return this.post('api/player/volume/down');
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

    setOption(id, value)
    {
        return this.setPlayerState({ options: [{id, value}] });
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

    playOrPause()
    {
        return this.post('api/player/play-pause');
    }

    togglePause()
    {
        return this.post('api/player/pause/toggle');
    }

    previous(params)
    {
        return this.post('api/player/previous', params);
    }

    next(params)
    {
        return this.post('api/player/next', params);
    }

    getPlaylist(plref)
    {
        return this.get(`api/playlists/${plref}`);
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

    getPlayQueue(columns)
    {
        return this.get('api/playqueue', { columns }).then(r => r.playQueue);
    }

    addToPlayQueue(plref, itemIndex, queueIndex = undefined)
    {
        return this.post('api/playqueue/add', { plref, itemIndex, queueIndex });
    }

    removeFromPlayQueueByQueueIndex(queueIndex)
    {
        return this.post('api/playqueue/remove', { queueIndex })
    }

    removeFromPlayQueueByItemIndex(plref, itemIndex)
    {
        return this.post('api/playqueue/remove', { plref, itemIndex })
    }

    clearPlayQueue()
    {
        return this.post('api/playqueue/clear');
    }

    getOutputs()
    {
        return this.get('api/outputs').then(r => r.outputs);
    }

    setOutputDevice(typeId, deviceId)
    {
        return this.post('api/outputs/active', { typeId, deviceId });
    }

    getFileSystemRoots()
    {
        return this.get('api/browser/roots');
    }

    getFileSystemEntries(path)
    {
        return this.get('api/browser/entries', { path });
    }

    getArtwork(playlist, item)
    {
        return this.get(`api/artwork/${playlist}/${item}`);
    }

    getClientConfig(id)
    {
        return this.get(`api/clientconfig/${id}`);
    }

    setClientConfig(id, value)
    {
        return this.post(`api/clientconfig/${id}`, value);
    }

    removeClientConfig(id)
    {
        return this.post(`api/clientconfig/remove/${id}`);
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
