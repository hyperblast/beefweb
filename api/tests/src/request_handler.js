'use strict';

const { URL, URLSearchParams } = require('url');
const axios = require('axios');
const EventSource = require('eventsource');

function formatParams(params)
{
    return new URLSearchParams(params).toString();
}

class TrackedEventSource extends EventSource
{
    constructor(owner, url, config)
    {
        super(url, config);

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
    }

    init(config)
    {
        if (this.axios)
            this.shutdown();

        this.lastStatus = 0;
        this.cancelSource = axios.CancelToken.source();
        this.eventSources = new Set();

        const fullConfig = Object.assign({
            baseURL: this.baseUrl,
            timeout: 5000,
            paramsSerializer: formatParams,
            cancelToken: this.cancelSource.token
        }, config);

        this.axios = axios.create(fullConfig);
        this.auth = fullConfig.auth || null;
    }

    shutdown()
    {
        if (this.cancelSource)
        {
            this.cancelSource.cancel('Abort');
            this.cancelSource = null;
        }

        if (this.eventSources)
        {
            for (let source of this.eventSources)
                source.close(false);

            this.eventSources = null;
        }

        this.axios = null;
        this.auth = null;
    }

    async get(url, params)
    {
        this.lastStatus = 0;
        const config = params ? { params } : undefined;
        const result = await this.axios.get(url, config);
        this.lastStatus = result.status;
        return result.data;
    }

    async post(url, data)
    {
        this.lastStatus = 0;
        const result = await this.axios.post(url, data);
        this.lastStatus = result.status;
        return result.data;
    }

    createEventSource(url, callback, params)
    {
        const urlObj = new URL(url, this.baseUrl);

        if (params)
            urlObj.search = formatParams(params);

        const source = new TrackedEventSource(
            this, urlObj.toString(), this.getEventSourceConfig());

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

    getEventSourceConfig()
    {
        if (!this.auth)
            return null;

        const authData = Buffer
            .from(`${this.auth.username}:${this.auth.password}`)
            .toString('base64');

        return {
            headers: {
                'Authorization': 'Basic ' + authData,
            },
        };
    }
}

module.exports = RequestHandler;
