'use strict';

const { URL, URLSearchParams } = require('url');
const axios = require('axios');
const EventSource = require('eventsource');

function formatParams(params)
{
    return new URLSearchParams(params).toString();
}

class RequestHandler
{
    constructor(baseUrl)
    {
        this.baseUrl = baseUrl;
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
        this.lastStatus = 0;
        const result = await this.axios.get(url, config);
        this.lastStatus = result.status;
        return result.data;
    }

    async post(url, data, config)
    {
        this.lastStatus = 0;
        const result = await this.axios.post(url, data, config);
        this.lastStatus = result.status;
        return result.data;
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
