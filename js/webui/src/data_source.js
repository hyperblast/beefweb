import EventEmitter from 'wolfy87-eventemitter'
import Timer from './timer.js'
import { looseDeepEqual } from './utils.js'

const eventNames = ['player', 'playlists', 'playlistItems', 'playQueue', 'outputs'];

export default class DataSource extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        this.eventSource = null;
        this.isStarted = false;
        this.subscriptions = {};
        this.previousEvents = {};

        this.handleEvent = this.handleEvent.bind(this);
        this.reconnectTimer = new Timer(this.reinitEventSource.bind(this), 20000);

        for (let event of eventNames)
            this.defineEvent(event);
    }

    start()
    {
        this.isStarted = true;
        this.reinitEventSource();
    }

    handleEvent(result)
    {
        this.reconnectTimer.restart();

        for (let event of eventNames)
        {
            const value = result[event];

            if (!value || looseDeepEqual(value, this.previousEvents[event]))
                continue;

            this.previousEvents[event] = value;
            this.emit(event, value);
        }
    }

    watch(eventName, args, forceUpdate = false)
    {
        if (forceUpdate)
            delete this.previousEvents[eventName];

        this.subscriptions[eventName] = Object.assign({}, args);
        this.reinitEventSource();
    }

    unwatch(eventName)
    {
        delete this.subscriptions[eventName];
        this.reinitEventSource();
    }

    createRequest()
    {
        const request = {};

        for (let prop of Object.keys(this.subscriptions))
        {
            request[prop] = true;
            Object.assign(request, this.subscriptions[prop]);
        }

        return request;
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

        const request = this.createRequest();

        this.eventSource = this.client.queryUpdates(request, this.handleEvent);
        this.reconnectTimer.restart();
    }
}
