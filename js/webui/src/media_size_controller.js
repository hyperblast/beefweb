import { mapValues } from 'lodash'
import { values as objectValues } from 'lodash'
import { MediaSize, MediaSizeIndex } from './settings_model.js'

const MediaSizes = Object.freeze({
    small: 0,
    medium: 31,
    large: 43,
});

const FontScale = Object.freeze({
    small: 0.875,
    medium: 1.0,
    large: 1.125,
});

function queryMinWidth(em)
{
    return window.matchMedia(`(min-width: ${em}em)`);
}

class MediaSizeQuery
{
    constructor(scale)
    {
        this.entries = [];

        for (let size of Object.keys(MediaSize))
        {
            const query = queryMinWidth(MediaSizes[size] * scale);

            this.entries[MediaSizeIndex[size]] = { size, query };
        }

        this.entries.reverse();
    }

    getMediaSize()
    {
        for (let entry of this.entries)
        {
            if (entry.query.matches)
                return entry.size;
        }

        throw Error("Internal error: unable to select any media size");
    }

    addListener(callback)
    {
        for (let entry of this.entries)
            entry.query.addListener(callback);
    }

    removeListener(callback)
    {
        for (let entry of this.entries)
            entry.query.removeListener(callback);
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
