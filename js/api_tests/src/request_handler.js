import { URL, URLSearchParams } from 'url';
import axios from 'axios';
import EventSource from 'eventsource';
import { formatQueryString, PlayerClientError } from 'beefweb-client';

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
            paramsSerializer: formatQueryString,
            cancelToken: this.cancelSource.token
        }, config);

        this.axios = axios.create(fullConfig);
        this.axiosConfig = fullConfig;
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
        this.axiosConfig = null;
    }

    async get(url, params)
    {
        this.lastStatus = 0;
        const config = params ? { params } : undefined;
        const result = await this.handleError(this.axios.get(url, config));
        this.lastStatus = result.status;
        return result.data;
    }

    async post(url, data)
    {
        this.lastStatus = 0;
        const result = await this.handleError(this.axios.post(url, data));
        this.lastStatus = result.status;
        return result.data;
    }

    async handleError(request)
    {
        try
        {
            return await request;
        }
        catch (error)
        {
            if (typeof error.response !== 'object')
                throw error;

            const { status, statusText, data } = error.response;
            throw PlayerClientError.create(status, statusText, data);
        }
    }

    createEventSource(url, callback, params)
    {
        const urlObj = new URL(url, this.baseUrl);

        if (params)
            urlObj.search = formatQueryString(params);

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
        if (!this.axiosConfig.auth)
            return null;

        const { username, password } = this.axiosConfig.auth;

        const authData = Buffer
            .from(`${username}:${password}`)
            .toString('base64');

        return {
            headers: {
                'Authorization': 'Basic ' + authData,
            },
        };
    }
}

export default RequestHandler;
