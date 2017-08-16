import EventEmitter from 'wolfy87-eventemitter'

export class ClientError extends Error
{
}

function parseResponse(xhr)
{
    if (xhr.getResponseHeader('Content-Type') != 'application/json')
        return null;

    return JSON.parse(xhr.responseText);
}

export default class RequestHandler extends EventEmitter
{
    constructor(baseUrl)
    {
        super();

        this.baseUrl = baseUrl;
    }

    get(req)
    {
        return this.send(Object.assign({ method: 'GET', wantResult: true }, req));
    }

    post(req)
    {
        return this.send(Object.assign({ method: 'POST', wantResult: false }, req));
    }

    send(req)
    {
        var url = this.formatUrl(req);

        return new Promise((resolve, reject) =>
        {
            var xhr = new XMLHttpRequest();
            xhr.onloadend = () => this.handleLoadEnd(req, xhr, resolve, reject);
            xhr.open(req.method, url, true);

            if (req.body)
            {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(req.body));
            }
            else
            {
                xhr.send();
            }
        });
    }

    subscribe(req)
    {
        var eventSource = new EventSource(this.formatUrl(req));

        eventSource.onmessage = e => {
            req.callback(JSON.parse(e.data), null);
        };

        eventSource.onerror = e => {
            req.callback(null, e);
            this.emit('error', e);
        };

        return eventSource;
    }

    handleLoadEnd(req, xhr, resolve, reject)
    {
        if (xhr.status >= 200 && xhr.status <= 299)
        {
            if (req.wantResult)
                resolve(parseResponse(xhr) || true);
            else
                resolve(true);
        }
        else
        {
            var error = new ClientError();
            Object.assign(error, parseResponse(xhr) || {});
            error.status = xhr.status;
            error.statusText = xhr.statusText;
            reject(error);
            this.emit('error', error);
        }
    }

    formatUrl(req)
    {
        var queryParts = [];

        if (req.params)
        {
            var params = req.params;

            for (var p in params)
            {
                if (params.hasOwnProperty(p) && params[p] !== undefined)
                {
                    var value = Array.isArray(value) ? params[p].join(',') : String(params[p]);

                    queryParts.push(`${encodeURIComponent(p)}=${encodeURIComponent(value)}`);
                }
            }
        }

        var query = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
        return `${this.baseUrl}/${req.path}${query}`;
    }
}
