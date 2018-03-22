import mapValues from 'lodash/mapValues'
import objectValues from 'lodash/values'
import SettingsModel, { FontSize, MediaSize } from './settings_model'

const MediaSizes = Object.freeze({
    tiny: 28,
    compact: 43,
});

const FontScale = Object.freeze({
    small: 0.875,
    medium: 1.0,
    large: 1.125,
});

function queryMaxWidth(em)
{
    return window.matchMedia(`(max-width: ${em}em)`);
}

class MediaSizeQuery
{
    constructor(scale)
    {
        this.queries = mapValues(MediaSizes, size => queryMaxWidth(size * scale));
    }

    getMediaSize()
    {
        if (this.queries.tiny.matches)
            return MediaSize.tiny;

        if (this.queries.compact.matches)
            return MediaSize.compact;

        return MediaSize.full;
    }

    addListener(callback)
    {
        for (let query of objectValues(this.queries))
            query.addListener(callback);
    }

    removeListener(callback)
    {
        for (let query of objectValues(this.queries))
            query.removeListener(callback);
    }
}

export default class MediaSizeController
{
    constructor(settingsModel)
    {
        this.settingsModel = settingsModel;

        this.mediaQueries = mapValues(FontScale, scale => new MediaSizeQuery(scale));
        this.update = this.update.bind(this);
    }

    start()
    {
        this.settingsModel.on('fontSizeChange', this.update);

        for (let query of objectValues(this.mediaQueries))
            query.addListener(this.update);

        this.update();
    }

    update()
    {
        const query = this.mediaQueries[this.settingsModel.fontSize];

        this.settingsModel.mediaSize = query.getMediaSize();
    }
}
