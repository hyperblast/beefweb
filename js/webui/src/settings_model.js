import { lineBreak, playlistColumns } from './columns.js';
import { primaryInput } from 'detect-it'
import SettingsModelBase from './settings_model_base.js';

export const SettingType = Object.freeze({
    bool: 'bool',
    enum: 'enum',
    string: 'string',
    percent: 'percent',
    custom: 'custom',
});

export const InputMode = Object.freeze({
    auto: 'auto',
    forceMouse: 'forceMouse',
    forceTouch: 'forceTouch',
});

export const MediaSize = Object.freeze({
    small: 'small',
    medium: 'medium',
    large: 'large',
});

export const UITheme = Object.freeze({
    system: 'system',
    light: 'light',
    dark: 'dark',
})

export const MediaSizeIndex = Object.freeze({
    [MediaSize.small]: 0,
    [MediaSize.medium]: 1,
    [MediaSize.large]: 2,
});

export const AddAction = Object.freeze({
    add: 'add',
    addAndPlay: 'addAndPlay',
    replaceAndPlay: 'replaceAndPlay'
});

const defaultColumns = {
    [MediaSize.small]: {
        columns: [
            playlistColumns.title,
            lineBreak,
            playlistColumns.artist,
        ]
    },

    [MediaSize.medium]: {
        columns: [
            playlistColumns.artist,
            playlistColumns.album,
            playlistColumns.title,
        ]
    },

    [MediaSize.large]: {
        columns: [
            playlistColumns.artist,
            playlistColumns.album,
            playlistColumns.track,
            playlistColumns.title,
            playlistColumns.duration
        ]
    }
};


/**
 * @class SettingsModel
 * @property {object} metadata
 * @property {object} columns
 * @property {boolean} fullWidth
 * @property {boolean} cursorFollowsPlayback
 * @property {string} customSortBy
 * @property {string} inputMode
 * @property {string} defaultAddAction
 * @property {string} windowTitleExpression
 * @property {string} playbackInfoExpression
 * @property {boolean} touchMode
 * @property {string} mediaSize
 * @property {boolean} compactMode
 * @property {boolean} combinePlayPause
 * @property {boolean} showPlaybackInfo
 * @property {boolean} showStatusBar
 * @property {number} uiScale
 * @property {string} uiTheme
 * @property {string} uiThemePreference
 */
export default class SettingsModel extends SettingsModelBase
{
    constructor(store, client)
    {
        super(store, client);

        this.define({
            key: 'fullWidth',
            type: SettingType.bool,
            defaultValue: false,
            title: 'Use full screen width',
            persistent: true,
            cssVisible: true,
        });

        this.define({
            key: 'cursorFollowsPlayback',
            type: SettingType.bool,
            defaultValue: false,
            persistent: true,
        });

        this.define({
            key: 'customSortBy',
            type: SettingType.string,
            defaultValue: '',
            persistent: true
        });

        this.define({
            key: 'windowTitleExpression',
            type: SettingType.string,
            defaultValue: '%artist% - %title%',
            persistent: true,
            title: 'Window title',
        });

        this.define({
            key: 'playbackInfoExpression',
            type: SettingType.string,
            defaultValue: '%artist% - %album% - %title%',
            persistent: true,
            title: 'Playback panel content',
        });

        this.define({
            key: 'inputMode',
            type: SettingType.enum,
            defaultValue: InputMode.auto,
            title: 'Input mode',
            persistent: true,
            enumKeys: InputMode,
            enumNames: {
                [InputMode.auto]: `Auto (currently ${primaryInput})`,
                [InputMode.forceMouse]: 'Force mouse',
                [InputMode.forceTouch]: 'Force touch'
            }
        });

        // Actual UI Theme (takes into account currently selected system theme)
        this.define({
            key: 'uiTheme',
            type: SettingType.enum,
            defaultValue: UITheme.light,
            cssVisible: true
        });

        // What user selects in settings screen
        this.define({
            key: 'uiThemePreference',
            type: SettingType.enum,
            defaultValue: UITheme.system,
            title: 'Color scheme',
            persistent: true,
            enumKeys: UITheme,
            enumNames: {
                [UITheme.system]: 'Use system setting',
                [UITheme.light]: 'Light',
                [UITheme.dark]: 'Dark',
            }
        });

        this.define({
            key: 'defaultAddAction',
            type: SettingType.enum,
            defaultValue: AddAction.add,
            title: 'Default file browser action',
            persistent: true,
            enumKeys: AddAction,
            enumNames: {
                [AddAction.add]: 'Add',
                [AddAction.addAndPlay]: 'Add & Play',
                [AddAction.replaceAndPlay]: 'Replace & Play'
            }
        });

        this.define({
            key: 'uiScale',
            type: SettingType.percent,
            defaultValue: 1.0,
            title: 'UI scale',
            minValue: 0.5,
            maxValue: 1.5,
            step: 0.05,
            persistent: true,
        });

        this.define({
            key: 'touchMode',
            type: SettingType.bool,
            defaultValue: false,
        });

        this.define({
            key: 'combinePlayPause',
            title: 'Combine Play and Pause buttons',
            type: SettingType.bool,
            defaultValue: false,
            persistent: true,
        });

        this.define({
            key: 'mediaSize',
            type: SettingType.enum,
            defaultValue: MediaSize.large,
            enumKeys: MediaSize,
            cssVisible: true,
        });

        this.define({
            key: 'columns',
            type: SettingType.custom,
            defaultValue: defaultColumns,
            persistent: true,
            version: 2
        });

        this.define({
            key: 'showPlaybackInfo',
            title: 'Show playback information panel',
            type: SettingType.bool,
            defaultValue: true,
            persistent: true,
        });

        this.define({
            key: 'showStatusBar',
            title: 'Show status bar',
            type: SettingType.bool,
            defaultValue: true,
            persistent: true,
        });

        this.define({
            key: 'compactMode',
            title: 'Hide gaps between panels',
            type: SettingType.bool,
            defaultValue: false,
            persistent: true,
            cssVisible: true,
        });

        this.finishConstruction();
    }

    mediaSizeUp(size)
    {
        return MediaSizeIndex[this.mediaSize] >= MediaSizeIndex[size];
    }

    mediaSizeDown(size)
    {
        return MediaSizeIndex[this.mediaSize] <= MediaSizeIndex[size];
    }
}
