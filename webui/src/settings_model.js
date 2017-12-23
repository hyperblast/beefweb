import EventEmitter from 'wolfy87-eventemitter'
import SettingsStore from './settings_store.js'
import pickBy from 'lodash/pickBy'

const storageKey = 'player_settings';

export const FontSize = Object.freeze({
    small: 'small',
    normal: 'normal',
    large: 'large'
});

export const InputMode = Object.freeze({
    auto: 'auto',
    forceMouse: 'forceMouse',
    forceTouch: 'forceTouch'
});

export const SettingType = Object.freeze({
    bool: 'bool',
    enum: 'enum',
});

const defaultSettingProps = Object.freeze({
    persistent: true
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
            defaultValue: FontSize.normal,
            title: 'Font size',
            enumKeys: FontSize,
            enumNames: {
                [FontSize.small]: 'Small',
                [FontSize.normal]: 'Normal',
                [FontSize.large]: 'Large'
            },
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

        const newValues = JSON.parse(data);
        const pendingEvents = [];

        for (let key of Object.getOwnPropertyNames(newValues))
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
        const values = pickBy(this.values, (value, key) => this.metadata[key].persistent);

        this.store.setItem(storageKey, JSON.stringify(values));
    }
}
