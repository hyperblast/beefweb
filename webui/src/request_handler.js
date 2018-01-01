import startsWith from 'lodash/startsWith'

function formatParams(params)
{
    return Object
        .getOwnPropertyNames(params)
        .map(p => encodeURIComponent(p) + '=' + encodeURIComponent(params[p]))
        .join('&');
}

function buildUrl(url, params)
{
    let result;

    if (startsWith(url, '/'))
        result = url;
    else
        result = '/' + url;

    if (params)
    {
        const paramsString = formatParams(params);

        if (paramsString)
            result = result + '?' + paramsString;
    }

    return result;
}

function isSuccessStatus(code)
{
    return code >= 200 && code <= 299;
}

class ClientError extends Error
{
}

class Request
{
    constructor(config)
    {
        this.config = config;
        this.promise = new Promise(this.execute.bind(this));
    }

    execute(resolve, reject)
    {
        this.resolve = resolve;
        this.reject = reject;

        this.httpRequest = new XMLHttpRequest();
        this.httpRequest.addEventListener('loadend', this.complete.bind(this));

        const url = buildUrl(this.config.url, this.config.params);
        this.httpRequest.open(this.config.method, url, true);

        if (this.config.data)
        {
            this.httpRequest.setRequestHeader('Content-Type', 'application/json');
            this.httpRequest.send(JSON.stringify(this.config.data));
        }
        else
        {
            this.httpRequest.send();
        }
    }

    complete()
    {
        if (isSuccessStatus(this.httpRequest.status))
            this.resolve(this.parseResponse());
        else
            this.reject(this.buildError());
    }

    buildError()
    {
        const { status, statusText } = this.httpRequest;

        return Object.assign(
            new ClientError(),
            this.parseResponse(),
            { status, statusText });
    }

    parseResponse()
    {
        const contentType = this.httpRequest.getResponseHeader('Content-Type');

        return contentType === 'application/json'
            ? JSON.parse(this.httpRequest.responseText)
            : null;
    }
}

export default class RequestHandler
{
    get(url, params)
    {
        return this.execute({ method: 'GET', url, params });
    }

    post(url, data)
    {
        return this.execute({ method: 'POST', url, data });
    }

    execute(config)
    {
        return new Request(config).promise;
    }

    createEventSource(url, callback, params)
    {
        const source = new EventSource(buildUrl(url, params));

        source.addEventListener('message', e => {
            callback(JSON.parse(e.data));
        });

        return source;
    }
}
