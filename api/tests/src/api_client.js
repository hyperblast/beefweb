'use strict';

const { URL } = require('url');
const axios = require('axios');
const { waitUntil } = require('./utils');

function formatParam(key, value)
{
    const valueString = Array.isArray(value) ? value.join(',') : String(value);

    return `${encodeURIComponent(key)}=${encodeURIComponent(valueString)}`
}

function formatParams(params)
{
    return Object
        .getOwnPropertyNames(params)
        .map(key => formatParam(key, params[key]))
        .join('&');
}

class RequestHandler
{
    constructor(baseUrl)
    {
        this.cancelSource = axios.CancelToken.source();

        this.axios = axios.create({
            baseURL: baseUrl,
            timeout: 5000,
            paramsSerializer: formatParams,
            cancelToken: this.cancelSource.token
        });
    }

    async get(url, config)
    {
        const response = await this.axios.get(url, config);
        return response.data;
    }

    async post(url, data, config)
    {
        const response = await this.axios.post(url, data, config);
        return response.data;
    }

    cancelRequests()
    {
        this.cancelSource.cancel('Abort');
    }
}

class ApiClient
{
    constructor(serverUrl)
    {
        this.serverUrl = serverUrl;
        this.createHandler();
    }

    createHandler()
    {
        this.handler = new RequestHandler(this.serverUrl);
    }

    cancelRequests()
    {
        this.handler.cancelRequests();
        this.createHandler();
    }

    async resetState()
    {
        await this.stop();

        await this.setPlayerState({
            order: 'linear',
            loop: 'all',
            isMuted: false,
            volumeDb: 0.0,
        });

        const playlists = await this.getPlaylists();

        for (let p of playlists)
            await this.removePlaylist(p.id);
    }

    async waitUntilReady()
    {
        return waitUntil(() => this.checkIsReady(), 400);
    }

    async checkIsReady()
    {
        try
        {
            await this.getPlayerState();
            return true;
        }
        catch(e)
        {
            return false;
        }
    }

    async getPlayerState(columns)
    {
        const config = columns ? { params: { columns } } : undefined;
        const response = await this.handler.get('api/player', config);
        return response.player;
    }

    setPlayerState(options)
    {
        return this.handler.post('api/player', options);
    }

    async waitForState(check)
    {
        let result = await waitUntil(async () => {
            const state = await this.getPlayerState();
            return check(state) ? state : null;
        });

        if (!result)
            throw Error('Failed to transition into expected state within allowed period');
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

    async getPlaylists()
    {
        const response = await this.handler.get('api/playlists');
        return response.playlists;
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

    async getPlaylistItems(plref, columns, offset = 0, count = 1000)
    {
        const url = `api/playlists/${plref}/items/${offset}:${count}`;
        const params = { columns };
        const response = await this.handler.get(url, { params });
        return response.playlistItems;
    }

    async getPlaylistFiles(plref, offset, count)
    {
        const items = await this.getPlaylistItems(
            plref, ['%path%'], offset, count);

        return items.map(i => i.columns[0]);
    }

    addPlaylistItems(plref, items, options)
    {
        const data = { items };

        if (options)
            Object.assign(data, options);

        return this.handler.post(
            `api/playlists/${plref}/items/add`, data);
    }

    sortPlaylistItems(plref, by, desc)
    {
        const data = { by };

        if (typeof desc !== 'undefined')
            data.desc = desc;

        return this.handler.post(
            `api/playlists/${plref}/items/sort`, data);
    }

    sortPlaylistItemsRandom(plref)
    {
        return this.handler.post(
            `api/playlists/${plref}/items/sort`, { random: true });
    }

    removePlaylistItems(plref, items)
    {
        return this.handler.post(
            `api/playlists/${plref}/items/remove`, { items });
    }

    copyPlaylistItems(plref, items, targetIndex)
    {
        const data = { items };

        if (typeof targetIndex !== 'undefined')
            data.targetIndex = targetIndex;

        return this.handler.post(
            `api/playlists/${plref}/items/copy`, data);
    }

    movePlaylistItems(plref, items, targetIndex)
    {
        const data = { items };

        if (typeof targetIndex !== 'undefined')
            data.targetIndex = targetIndex;

        return this.handler.post(
            `api/playlists/${plref}/items/move`, data);
    }

    copyPlaylistItemsEx(source, target, items, targetIndex)
    {
        const data = { items };

        if (typeof targetIndex !== 'undefined')
            data.targetIndex = targetIndex;

        return this.handler.post(
            `api/playlists/${source}/${target}/items/copy`, data);
    }

    movePlaylistItemsEx(source, target, items, targetIndex)
    {
        const data = { items };

        if (typeof targetIndex !== 'undefined')
            data.targetIndex = targetIndex;

        return this.handler.post(
            `api/playlists/${source}/${target}/items/move`, data);
    }

    async getRoots()
    {
        const response = await this.handler.get('api/browser/roots');
        return response.roots;
    }

    async getEntries(path)
    {
        const response = await this.handler.get(
            'api/browser/entries', { params: { path } });
        return response.entries;
    }
}

module.exports = ApiClient;
