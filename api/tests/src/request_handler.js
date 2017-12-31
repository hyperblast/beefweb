'use strict';

const { URL } = require('url');
const axios = require('axios');
const EventSource = require('eventsource');

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

module.exports = RequestHandler;
