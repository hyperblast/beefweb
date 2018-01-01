import EventEmitter from 'wolfy87-eventemitter'

export default class DataSource extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        this.eventSource = null;
        this.isStarted = false;
        this.subscriptions = {};
        this.handleEvent = this.handleEvent.bind(this);
        this.defineEvent('player');
        this.defineEvent('playlists');
        this.defineEvent('playlistItems');
    }

    start()
    {
        this.isStarted = true;
        this.reinitEventSource();
    }

    handleEvent(result)
    {
        if (result.player)
            this.emit('player', result.player);

        if (result.playlists)
            this.emit('playlists', result.playlists);

        if (result.playlistItems)
            this.emit('playlistItems', result.playlistItems);
    }

    watch(eventName, args = null)
    {
        this.subscriptions[eventName] = args ? Object.assign({}, args) : {};
        this.reinitEventSource();
    }

    unwatch(eventName)
    {
        delete this.subscriptions[eventName];
        this.reinitEventSource();
    }

    reinitEventSource()
    {
        if (!this.isStarted)
            return;

        if (this.eventSource)
        {
            this.eventSource.close();
            this.eventSource = null;
        }

        let request = {};

        for (let prop in this.subscriptions)
        {
            if (this.subscriptions.hasOwnProperty(prop))
            {
                request[prop] = true;
                Object.assign(request, this.subscriptions[prop]);
            }
        }

        this.eventSource = this.client.queryUpdates(request, this.handleEvent);
    }
}
