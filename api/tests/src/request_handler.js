'use strict';

const { URL, URLSearchParams } = require('url');
const axios = require('axios');
const EventSource = require('eventsource');
const pickBy = require('lodash/pickBy');

function skipUndefined(values)
{
    return pickBy(values, value => typeof value !== 'undefined');
}

function formatParams(params)
{
    return new URLSearchParams(params).toString();
}

class TrackedEventSource extends EventSource
{
    constructor(owner, url)
    {
        super(url);
        this.owner = owner;
    }

    close(unregister = true)
    {
        if (unregister)
            this.owner.unregisterEventSource(this);

        super.close();
    }
}

class RequestHandler
{
    constructor(baseUrl)
    {
        this.baseUrl = baseUrl;
        this.init();
    }

    init()
    {
        this.lastStatus = 0;
        this.cancelSource = axios.CancelToken.source();
        this.eventSources = new Set();

        this.axios = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000,
            paramsSerializer: formatParams,
            cancelToken: this.cancelSource.token
        });
    }

    reset()
    {
        this.cancelSource.cancel('Abort');

        for (let source of this.eventSources)
            source.close(false);

        this.init();
    }

    async get(url, params)
    {
        this.lastStatus = 0;
        const config = params ? { params: skipUndefined(params) } : undefined;
        const result = await this.axios.get(url, config);
        this.lastStatus = result.status;
        return result.data;
    }

    async post(url, data)
    {
        this.lastStatus = 0;
        const postData = data ? skipUndefined(data) : undefined;
        const result = await this.axios.post(url, postData);
        this.lastStatus = result.status;
        return result.data;
    }

    createEventSource(url, callback, params)
    {
        const urlObj = new URL(url, this.baseUrl);

        if (params)
            urlObj.search = formatParams(skipUndefined(params));

        const source = new TrackedEventSource(this, urlObj.toString());

        source.addEventListener('message', event => {
            callback(JSON.parse(event.data));
        });

        this.eventSources.add(source);
        return source;
    }

    unregisterEventSource(source)
    {
        this.eventSources.delete(source);
    }
}

module.exports = RequestHandler;
