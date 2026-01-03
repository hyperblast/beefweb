import { cloneDeep, isEqual } from 'lodash';
import { SettingType } from './settings_model.js';
import EventEmitter from 'wolfy87-eventemitter';

const storageKey = 'player_settings';
const clientConfigKey = 'webui_default_settings';

const defaultSettingProps = Object.freeze({
    persistent: false,
    cssVisible: false,
    version: 1,
});

export default class SettingsModelBase extends EventEmitter
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
    }

    define(props)
    {
        const { key, type } = props;
        const metadata = Object.assign({}, defaultSettingProps, props);

        metadata.eventName = key + 'Change';

        if (metadata.persistent)
        {
            metadata.persistenceKey = metadata.version === 1 ? key :`${key}_v${metadata.version}`
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
        return this.client.getClientConfig(clientConfigKey)
            .then(r => r && r[key] !== undefined ? r[key] : this.metadata[key].defaultValue);
    }

    resetValueToDefault(key)
    {
        this.getDefaultValue(key).then(value => this.setValue(key, value));
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

    initialize()
    {
        if (this.load())
        {
            return Promise.resolve();
        }
        else
        {
            return this.resetToDefault();
        }
    }

    load()
    {
        const data = this.store.getItem(storageKey);

        if (!data)
            return false;

        const newValues = JSON.parse(data);
        this.loadFromObject(newValues);
        return true;
    }

    save()
    {
        const values = this.saveToObject();
        this.store.setItem(storageKey, JSON.stringify(values));
    }

    saveAsDefault()
    {
        return this.client.setClientConfig(clientConfigKey, this.saveToObject());
    }

    resetToDefault()
    {
        return this.client.getClientConfig(clientConfigKey)
        .then(r => {
            this.loadFromObject(Object.assign(this.getDefaultValuesFromCode(), r));
            this.save();
        });
    }

    clearSavedDefault()
    {
        return this.client.removeClientConfig(clientConfigKey);
    }

    finishConstruction()
    {
        Object.freeze(this.metadata);
    }
}
