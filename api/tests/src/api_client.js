'use strict';

const { URL } = require('url');
const axios = require('axios');
const EventSource = require('eventsource');
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
        this.baseUrl = baseUrl;
        this.expectedStatus = 0;
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
        const result = await this.axios.get(url, config);
        this.checkExpectedStatus(result);
        return result.data;
    }

    async post(url, data, config)
    {
        const result = await this.axios.post(url, data, config);
        this.checkExpectedStatus(result);
        return result.data;
    }

    checkExpectedStatus(result)
    {
        if (!this.expectedStatus)
            return;

        const expected = this.expectedStatus;
        this.expectedStatus = 0;

        const actual = result.status;

        if (expected !== actual)
            throw Error(`Expected status code ${expected}, got ${actual}`);
    }

    createEventSource(url, callback, options)
    {
        const urlObj = new URL(url, this.baseUrl);

        if (options)
            urlObj.search = formatParams(options);

        const source = new EventSource(urlObj.toString());

        source.addEventListener('message', event => {
            callback(JSON.parse(event.data));
        });

        return source;
    }

    cancelRequests()
    {
        this.cancelSource.cancel('Abort');
    }
}

const ExpectationState = Object.freeze({
    initializing: 0,
    waitingFirstEvent: 1,
    waitingCondition: 2,
    done: 3,
});

class EventExpectation
{
    constructor(sourceFactory, condition)
    {
        this.sourceFactory = sourceFactory;
        this.condition = condition;
        this.state = ExpectationState.initializing;
        this.ready = new Promise(this.runReadyPromise.bind(this));
    }

    runReadyPromise(resolve, reject)
    {
        this.resolveReady = resolve;
        this.rejectReady = reject;
        this.done = new Promise(this.runDonePromise.bind(this));
    }

    runDonePromise(resolve, reject)
    {
        this.resolveDone = resolve;
        this.rejectDone = reject;
        this.source = this.sourceFactory(this.handleEvent.bind(this));
        this.timeout = setTimeout(this.handleTimeout.bind(this), 3000);
        this.state = ExpectationState.waitingFirstEvent;
    }

    handleEvent(event)
    {
        if (this.state === ExpectationState.done)
            return;

        if (this.state === ExpectationState.waitingFirstEvent)
        {
            this.state = ExpectationState.waitingCondition;
            this.resolveReady();
            return;
        }

        this.lastEvent = event;

        if (!this.condition(event))
            return;

        this.complete();
        this.resolveDone();
    }

    handleTimeout()
    {
        if (this.state === ExpectationState.done)
            return;

        const waitingFirstEvent = this.state === ExpectationState.waitingFirstEvent;
        const error = new Error('Failed to recieve expected event');

        this.complete();
        this.rejectDone(error);

        if (waitingFirstEvent)
            this.rejectReady(error);
    }

    complete()
    {
        this.state = ExpectationState.done;
        this.source.close();
        clearTimeout(this.timeout);
    }
};

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
        await this.waitForState(s => s.playbackState === 'stopped');

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

    expectStatus(code)
    {
        this.handler.expectedStatus = code;
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
        let state;

        let result = await waitUntil(async () => {
            state = await this.getPlayerState();
            return check(state);
        });

        if (result)
            return result;

        console.error('Current player state:\n', state);
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

    renamePlaylist(plref, title)
    {
        return this.handler.post(`api/playlists/${plref}`, { title });
    }

    setCurrentPlaylist(plref)
    {
        return this.handler.post('api/playlists', { current: plref });
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

    query(options)
    {
        return this.handler.get('api/query', { params: options });
    }

    queryEvents(options, callback)
    {
        return this.handler.createEventSource(
            'api/query/events', callback, options);
    }

    expectEvent(options, condition)
    {
        return new EventExpectation(
            cb => this.queryEvents(options, cb), condition);
    }

    queryUpdates(options, callback)
    {
        return this.handler.createEventSource(
            'api/query/updates', callback, options);
    }

    expectUpdate(options, condition)
    {
        return new EventExpectation(
            cb => this.queryUpdates(options, cb), condition);
    }
}

module.exports = ApiClient;
