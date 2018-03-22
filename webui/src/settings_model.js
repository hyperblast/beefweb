import EventEmitter from 'wolfy87-eventemitter'
import SettingsStore from './settings_store.js'
import pickBy from 'lodash/pickBy'
import mapKeys from 'lodash/mapKeys'

const storageKey = 'player_settings';

export const SettingType = Object.freeze({
    bool: 'bool',
    enum: 'enum',
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
    full: 'full',
    compact: 'compact',
    tiny: 'tiny',
});

const defaultSettingProps = Object.freeze({
    persistent: true,
    version: 1,
});

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
        });

        this.define({
            key: 'inputMode',
            type: SettingType.enum,
            defaultValue: InputMode.auto,
            title: 'Input mode',
            enumKeys: InputMode,
            enumNames: {
                [InputMode.auto]: 'Auto',
                [InputMode.forceMouse]: 'Force mouse',
                [InputMode.forceTouch]: 'Force touch'
            }
        });

        this.define({
            key: 'fontSize',
            type: SettingType.enum,
            version: 2,
            defaultValue: FontSize.medium,
            title: 'Font size',
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
            persistent: false,
        });

        this.define({
            key: 'mediaSize',
            type: SettingType.enum,
            defaultValue: MediaSize.full,
            enumKeys: MediaSize,
            persistent: false,
        });

        Object.freeze(this.metadata);
    }

    define(props)
    {
        const { key, type } = props;

        const metadata = Object.freeze(Object.assign(
            {}, defaultSettingProps, props, { eventName: key + 'Change' }));

        if (type == SettingType.enum)
            Object.freeze(metadata.enumNames);

        this.metadata[key] = metadata;
        this.values[key] = metadata.defaultValue;

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

        if (value === this.values[key])
            return;

        this.values[key] = value;

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

        const newValues = mapKeys(
            JSON.parse(data),
            (value, key) => this.removePersistenceVersion(key));

        const pendingEvents = [];

        for (let key of Object.keys(newValues))
        {
            const metadata = this.metadata[key];

            if (!metadata)
                continue;

            const value = newValues[key];

            if (this.values[key] === value)
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
            (value, key) => this.addPersistenceVersion(key));

        this.store.setItem(storageKey, JSON.stringify(values));
    }

    addPersistenceVersion(key)
    {
        const metadata = this.metadata[key];

        if (metadata.version === 1)
            return key;

        return `${key}_v${metadata.version}`;
    }

    removePersistenceVersion(key)
    {
        const index = key.lastIndexOf('_');

        if (index < 0)
            return key;

        return key.substring(0, index);
    }
}
