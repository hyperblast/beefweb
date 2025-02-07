import EventEmitter from 'wolfy87-eventemitter'
import { pickBy } from 'lodash'
import { mapKeys } from 'lodash'
import { cloneDeep } from 'lodash'
import { isEqual } from 'lodash'
import { defaultPlaylistColumns } from './columns.js';

const storageKey = 'player_settings';
const userConfigKey = 'webui';

export const SettingType = Object.freeze({
    bool: 'bool',
    enum: 'enum',
    string: 'string',
    custom: 'custom',
});

export const FontSize = Object.freeze({
    small: 'small',
    medium: 'medium',
    large: 'large',
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

const defaultSettingProps = Object.freeze({
    persistent: false,
    cssVisible: false,
    version: 1,
});

/**
 * @class SettingsModel
 * @property {object} metadata
 * @property {boolean} fullWidth
 * @property {boolean} cursorFollowsPlayback
 * @property {string} customSortBy
 * @property {string} inputMode
 * @property {string} fontSize
 * @property {string} defaultAddAction
 * @property {string} windowTitleExpression
 * @property {string} playbackInfoExpression
 * @property {boolean} touchMode
 * @property {string} mediaSize
 * @property {boolean} compactMode
 * @property {boolean} showPlaybackInfo
 * @property {boolean} showStatusBar
 * @property {string} uiTheme
 * @property {string} uiThemePreference
 */
export default class SettingsModel extends EventEmitter
{
    constructor(store, client)
    {
        super();

        this.store = store;
        this.client = client;

        this.metadata = {};
        this.values = {};

        this.defineEvent('change');
        this.store.on('refresh', this.load.bind(this));

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
                [InputMode.auto]: 'Auto',
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
            title: 'UI Theme',
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
            key: 'fontSize',
            type: SettingType.enum,
            version: 2,
            defaultValue: FontSize.medium,
            title: 'UI elements size',
            persistent: true,
            cssVisible: true,
            enumKeys: FontSize,
            enumNames: {
                [FontSize.small]: 'Small',
                [FontSize.medium]: 'Medium',
                [FontSize.large]: 'Large'
            },
        });

        this.define({
            key: 'touchMode',
            type: SettingType.bool,
            defaultValue: false,
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
            defaultValue: defaultPlaylistColumns,
            persistent: true,
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

        Object.freeze(this.metadata);
    }

    define(props)
    {
        const { key, type } = props;

        const metadata = Object.assign({}, defaultSettingProps, props);

        metadata.eventName = key + 'Change';

        if (metadata.persistent)
        {
            metadata.persistenceKey = metadata.version === 1
                ? key
                :`${key}_v${metadata.version}`
        }

        Object.freeze(metadata);

        if (type === SettingType.enum)
            Object.freeze(metadata.enumNames);

        this.metadata[key] = metadata;
        this.values[key] = cloneDeep(metadata.defaultValue);

        Object.defineProperty(this, key, {
            enumerable: true,
            get: function() { return this.getValue(key); },
            set: function(value) { this.setValue(key, value); }
        });

        this.defineEvent(metadata.eventName);
    }

    setValue(key, value)
    {
        const metadata = this.metadata[key];

        if (!metadata)
            throw new Error(`Unknown setting key '${key}'`);

        if (isEqual(value, this.values[key]))
            return;

        this.values[key] = cloneDeep(value);

        if (metadata.persistent)
            this.save();

        this.emit(metadata.eventName);
        this.emit('change');
    }

    getValue(key)
    {
        return this.values[key];
    }

    getDefaultValue(key)
    {
        return this.client.getUserConfig(userConfigKey)
            .then(r => r && r[key] !== undefined ? r[key] : this.metadata[key].defaultValue);
    }

    getDefaultValuesFromCode()
    {
        let result = {};

        for (let key in this.metadata)
        {
            const metadata = this.metadata[key];

            if (metadata.persistent)
            {
                result[key] = metadata.defaultValue;
            }
        }

        return result;
    }

    saveToObject()
    {
        let result = {};

        for (let key in this.metadata)
        {
            const metadata = this.metadata[key];

            if (metadata.persistent)
            {
                result[metadata.persistenceKey] = this.values[key];
            }
        }

        return result;
    }

    loadFromObject(newValues)
    {
        const pendingEvents = [];

        for (let key in this.metadata)
        {
            const metadata = this.metadata[key];
            const value = newValues[metadata.persistenceKey];

            if (value === undefined || isEqual(this.values[key], value))
                continue;

            this.values[key] = value;
            pendingEvents.push(metadata.eventName);
        }

        for (let event of pendingEvents)
            this.emit(event);

        if (pendingEvents.length > 0)
            this.emit('change');
    }

    load()
    {
        const data = this.store.getItem(storageKey);

        if (!data)
            return;

        const newValues = JSON.parse(data);
        this.loadFromObject(newValues);
    }

    save()
    {
        const values = this.saveToObject();
        this.store.setItem(storageKey, JSON.stringify(values));
    }

    saveAsDefault()
    {
        return this.client.setUserConfig(userConfigKey, this.saveToObject());
    }

    resetToDefault()
    {
        return this.client.getUserConfig(userConfigKey)
            .then(r => this.loadFromObject(Object.assign(this.getDefaultValuesFromCode(), r)));
    }

    clearSavedDefault()
    {
        return this.client.clearUserConfig(userConfigKey);
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
