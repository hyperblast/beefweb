import SettingsModel, { FontSize } from './settings_model'

function queryMaxWidth(em)
{
    return window.matchMedia(`(max-width: ${em}em)`);
}

const compactLayoutSize = 43;

export default class MediaSizeController
{
    constructor(playlistModel, settingsModel)
    {
        this.playlistModel = playlistModel;
        this.settingsModel = settingsModel;

        this.update = this.update.bind(this);

        this.mediaQueries = {
            [FontSize.small]: queryMaxWidth(0.875 * compactLayoutSize),
            [FontSize.normal]: queryMaxWidth(1.0 * compactLayoutSize),
            [FontSize.large]: queryMaxWidth(1.125 * compactLayoutSize),
        };
    }

    start()
    {
        this.settingsModel.on('change', this.update);

        this.mediaQueries[FontSize.small].addListener(this.update);
        this.mediaQueries[FontSize.normal].addListener(this.update);
        this.mediaQueries[FontSize.large].addListener(this.update);

        this.update();
    }

    update()
    {
        const query = this.mediaQueries[this.settingsModel.fontSize];

        this.playlistModel.setCompactMode(query.matches);
    }
}
