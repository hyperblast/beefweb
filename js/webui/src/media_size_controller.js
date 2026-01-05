import { MediaSize } from './settings_model.js'
import { debounce } from 'lodash';

const Breakpoints = Object.freeze({
    large: 60, // 60 * 16 = 960px
    medium: 40, // 40 * 16 = 640px
});

function queryMinWidth(em)
{
    return window.matchMedia(`(min-width: ${em}em)`);
}

class MediaSizeQuery
{
    constructor(scale)
    {
        // Media queries does not take 'font-size' on <html> into account, we need to scale manually
        this.largeQuery = queryMinWidth(Breakpoints.large * scale);
        this.mediumQuery = queryMinWidth(Breakpoints.medium * scale);
    }

    getMediaSize()
    {
        if (this.largeQuery.matches)
            return MediaSize.large;

        if (this.mediumQuery.matches)
            return MediaSize.medium;

        return MediaSize.small;
    }

    addListener(callback)
    {
        this.largeQuery.addEventListener('change', callback);
        this.mediumQuery.addEventListener('change', callback);
    }

    removeListener(callback)
    {
        this.largeQuery.removeEventListener('change', callback);
        this.mediumQuery.removeEventListener('change', callback);
    }
}

export default class MediaSizeController
{
    constructor(settingsModel)
    {
        this.settingsModel = settingsModel;
        this.updateMediaSize = this.updateMediaSize.bind(this);
    }

    start()
    {
        this.settingsModel.on('uiScale', debounce(this.updateScale.bind(this), 500));
        this.updateScale();
    }

    updateScale()
    {
        const scale = this.settingsModel.uiScale;

        document.documentElement.style.fontSize = `${scale * 100}%`;

        this.mediaSizeQuery?.removeListener(this.updateMediaSize);
        this.mediaSizeQuery = new MediaSizeQuery(scale);
        this.mediaSizeQuery.addListener(this.updateMediaSize);

        this.updateMediaSize();
    }

    updateMediaSize()
    {
        this.settingsModel.mediaSize = this.mediaSizeQuery.getMediaSize();
    }
}
