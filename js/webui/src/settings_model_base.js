import { isEqual } from './lodash.js';
import { SettingType } from './settings_model.js';
import ModelBase from './model_base.js';

const storageKey = 'player_settings';
const clientConfigKey = 'webui_default_settings';

const defaultSettingProps = Object.freeze({
    persistent: false,
    cssVisible: false,
    version: 1,
});

export default class SettingsModelBase extends ModelBase
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

        this.defineEvent(key);

        metadata.getter = () => this.getValue(key);
        metadata.setter = value => this.setValue(key, value);
        metadata.subscriber = this.createSubscriber(key);

        if (metadata.persistent)
        {
            metadata.persistenceKey = metadata.version === 1 ? key :`${key}_v${metadata.version}`
        }

        Object.freeze(metadata);
        Object.freeze(metadata.defaultValue);

        if (type === SettingType.enum)
            Object.freeze(metadata.enumNames);

        this.metadata[key] = metadata;
        this.values[key] = metadata.defaultValue;

        Object.defineProperty(this, key, {
            enumerable: true,
            get: metadata.getter,
            set: metadata.setter,
        });
    }

    setValue(key, value)
    {
        const metadata = this.metadata[key];
        if (!metadata)
            throw new Error(`Unknown setting key '${key}'`);

        if (isEqual(value, this.values[key]))
            return;

        this.values[key] = Object.freeze(structuredClone(value));

        if (metadata.persistent)
            this.save();

        this.emit(key);
        this.emit('change');
    }

    getValue(key)
    {
        return this.values[key];
    }

    async getDefaultValue(key)
    {
        const metadata = this.metadata[key];
        if (!metadata)
            throw new Error(`Unknown setting key '${key}'`);

        let defaultValue;

        if (metadata.persistent)
        {
            const savedDefaults = await this.client.getClientConfig(clientConfigKey);

            if (savedDefaults)
            {
                defaultValue = savedDefaults[metadata.persistenceKey];
            }
        }

        return defaultValue !== undefined ? Object.freeze(defaultValue) : metadata.defaultValue
    }

    async resetValueToDefault(key)
    {
        const value = await this.getDefaultValue(key);
        this.setValue(key, value);
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

            this.values[key] = Object.freeze(value);
            pendingEvents.push(key);
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

    async resetToDefault()
    {
        const config = await this.client.getClientConfig(clientConfigKey);
        this.loadFromObject(Object.assign(this.getDefaultValuesFromCode(), config));
        this.save();
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
