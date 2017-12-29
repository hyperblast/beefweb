'use strict';

const { URL } = require('url');
const axios = require('axios');

function formatParam(key, value)
{
    const valueString = Array.isArray(value) ? value.join(',') : String(value);

    return `${encodeURIComponent(key)}=${encodeURIComponent(valueString)}`
}

function formatParams(params)
{
    return Object
        .getOwnPropertyNames(params)
        .map(key => formatParam(key, params[value]))
        .join('&');
}

function sleep(timeout)
{
    return new Promise(resolve => setTimeout(resolve, timeout));
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

    async waitUntilReady()
    {
        if (await this.checkIsReady())
            return true;

        for (let i = 1; i < 10; i++)
        {
            await sleep(200);

            if (await this.checkIsReady())
                return true;
        }

        return false;
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

    async getPlayerState()
    {
        const state = await this.handler.get('api/player');
        return state.player;
    }

    setPlayerState(options)
    {
        return this.handler.post('api/player', options);
    }

    getPlaylists()
    {
        return this.handler.get('api/playlists');
    }
}

module.exports = ApiClient;