const events = Symbol('events');

function getCallbacks(model, eventName)
{
    const callbacks = model[events].get(eventName);

    if (!callbacks)
        throw new Error('Unknown event name: ' + eventName);

    return callbacks;
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
