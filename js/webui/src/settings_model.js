import EventEmitter from 'wolfy87-eventemitter'
import pickBy from 'lodash/pickBy'
import mapKeys from 'lodash/mapKeys'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import { defaultPlaylistColumns } from './columns';

const storageKey = 'player_settings';

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
 * @property {boolean} showPlaybackInfo
 */
export default class SettingsModel extends EventEmitter
{
    constructor(store)
    {
        super();

        this.store = store;

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
            title: 'Font size',
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
            persistent: true
        });

        this.define({
            key: 'showPlaybackInfo',
            title: 'Show playback information panel',
            type: SettingType.bool,
            defaultValue: false,
            persistent: true,
        });

        this.define({
            key: 'enableNotification',
            title: 'Enable playback control notification',
            type: SettingType.bool,
            defaultValue: false,
            persistent: true,
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

    load()
    {
        const data = this.store.getItem(storageKey);

        if (!data)
            return;

        const newValues = JSON.parse(data);
        const pendingEvents = [];

        for (let key of Object.keys(this.metadata))
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

    save()
    {
        const values = mapKeys(
            pickBy(this.values, (value, key) => this.metadata[key].persistent),
            (value, key) => this.metadata[key].persistenceKey);

        this.store.setItem(storageKey, JSON.stringify(values));
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
