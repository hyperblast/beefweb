const events = Symbol('events');

function getCallbacks(model, eventName)
{
    const callbacks = model[events].get(eventName);

    if (!callbacks)
        throw new Error('Unknown event name: ' + eventName);

    return callbacks;
}

function buildCallbackList(context, eventDefs)
{
    const callbacks = [];

    for (let modelKey in eventDefs)
    {
        const eventDef = eventDefs[modelKey];
        const model = context[modelKey];

        if (!model)
            throw new Error(`Unknown model '${modelKey}'`);

        if (Array.isArray(eventDef))
        {
            for (let eventName of eventDef)
                callbacks.push(getCallbacks(model, eventName));
        }
        else if (typeof eventDef === 'string')
        {
            callbacks.push(getCallbacks(model, eventDef));
        }
        else
        {
            throw new Error(`Invalid event name or event list for model '${modelKey}': '${eventDef}'`);
        }
    }

    return callbacks;
}

export function createSubscriber(eventDefs)
{
    let callbacks = null;

    return (context, callback) => {
        callbacks ??= buildCallbackList(context, eventDefs);

        for (let set of callbacks)
            set.add(callback);

        return () => {
            for (let set of callbacks)
                set.delete(callback);
        };
    };
}

export default class ModelBase
{
    constructor()
    {
        this[events] = new Map();
    }

    on(eventName, callback)
    {
        getCallbacks(this, eventName).add(callback);
    }

    off(eventName, callback)
    {
        getCallbacks(this, eventName).delete(callback);
    }

    subscribe(eventName, callback)
    {
        const callbacks = getCallbacks(this, eventName);
        callbacks.add(callback);
        return () => callbacks.delete(callback);
    }

    defineEvent(eventName)
    {
        this[events].set(eventName, new Set());
    }

    emit(eventName, arg)
    {
        for (let callback of getCallbacks(this, eventName))
        {
            callback(arg);
        }
    }
}
