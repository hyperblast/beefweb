const events = Symbol('events');

function getCallbacks(model, eventName)
{
    const callbacks = model[events].get(eventName);

    if (!callbacks)
        throw new Error('Unknown event name: ' + eventName);

    return callbacks;
}

function getCallbackList(context, eventDefs)
{
    const cachedValue = context.eventCallbacks.get(eventDefs);

    if (cachedValue)
    {
        return cachedValue;
    }

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

    context.eventCallbacks.set(eventDefs, callbacks);

    return callbacks;
}

export function subscribeAll(context, eventDefs, callback)
{
    const callbacks = getCallbackList(context, eventDefs);

    for (let set of callbacks)
        set.add(callback);

    return () => {
        for (let set of callbacks)
            set.delete(callback);
    };
}

export default class ModelBase
{
    constructor()
    {
        this[events] = new Map();
    }

    defineEvent(eventName)
    {
        this[events].set(eventName, new Set());
    }

    on(eventName, callback)
    {
        getCallbacks(this, eventName).add(callback);
    }

    off(eventName, callback)
    {
        getCallbacks(this, eventName).delete(callback);
    }

    createSubscriber(eventName)
    {
        const callbacks = getCallbacks(this, eventName);

        return callback => {
            callbacks.add(callback);
            return () => callbacks.delete(callback);
        };
    }

    emit(eventName, arg)
    {
        for (let callback of getCallbacks(this, eventName))
        {
            callback(arg);
        }
    }
}
