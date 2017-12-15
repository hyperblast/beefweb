export default class SettingsStore
{
    on(eventName, callback)
    {
        if (eventName === 'refresh')
            window.addEventListener('storage', callback);
    }

    off(eventName, callback)
    {
        if (eventName === 'refresh')
            window.removeEventListener('storage', callback);
    }

    getItem(key)
    {
        return localStorage.getItem(key);
    }

    setItem(key, value)
    {
        localStorage.setItem(key, value);
    }
}
