import Navigo from 'navigo';

const pushUrlOptions = {
    callHandler: false,
    callHooks: false
};

const replaceUrlOptions = {
    callHandler: false,
    callHooks: false,
    historyAPIMethod: 'replaceState'
};

function getValueAfterHash(url)
{
    const pos = url.indexOf('#');
    return pos >= 0 ? url.substring(pos + 1) : url;
}

export class Router
{
    constructor(navigationModel)
    {
        this.navigationModel = navigationModel;
        this.navigo = new Navigo('/', { hash: true });
        this.updating = 0;
    }

    start()
    {
        this.navigo.resolve();
    }

    on()
    {
        this.navigo.on(...arguments);
    }

    notFound(arg)
    {
        this.navigo.notFound(arg);
    }

    setView(view)
    {
        return this.update(() => this.navigationModel.setView(view));
    }

    setSettingsView(view)
    {
        return this.update(() => this.navigationModel.setSettingsView(view));
    }

    update(callback)
    {
        this.updating++;
        try
        {
            return callback();
        }
        finally
        {
            this.updating--;
        }
    }

    async updateAsync(callback)
    {
        this.updating++;
        try
        {
            return await callback();
        }
        finally
        {
            this.updating--;
        }
    }

    onModelEvent(model, eventName, callback)
    {
        model.on(eventName, () => {
            if (!this.updating)
                callback();
        })
    }

    navigate(url, options)
    {
        const currentUrl = getValueAfterHash(this.navigo.getCurrentLocation().url);
        const requestedUrl = getValueAfterHash(url);

        if (currentUrl !== requestedUrl)
            this.navigo.navigate(requestedUrl, options);
    }

    pushUrl(url)
    {
        this.navigate(url, pushUrlOptions);
    }

    replaceUrl(url)
    {
        this.navigate(url, replaceUrlOptions);
    }
}