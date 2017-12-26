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

    async get()
    {
        const response = await this.axios.get.apply(this.axios, arguments);
        return response.data;
    }

    async post()
    {
        const response = await this.axios.post.apply(this.axios, arguments);
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
        this.apiUrl = new URL('/api', serverUrl).toString();
        this.createHandler();
    }

    createHandler()
    {
        this.handler = new RequestHandler(this.apiUrl);
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

        throw new Error('Failed to reach API endpoint within timeout');
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

    getPlayerState()
    {
        return this.handler.get('/player');
    }

    getPlaylists()
    {
        return this.handler.get('/playlists');
    }
}

module.exports = ApiClient;