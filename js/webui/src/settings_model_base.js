import { isEqual } from './lodash.js';
import { SettingType } from './settings_model.js';
import ModelBase from './model_base.js';

const storageKey = 'player_settings';
const clientConfigKey = 'webui_default_settings';

const defaultSettingProps = Object.freeze({
    persistent: false,
    cssVisible: false,
    version: 1,
    migrator: null
});

function isConfigValue(value)
{
    return value && typeof value === 'object' && !Array.isArray(value);
}

function parseConfig(str)
{
    if (!str)
        return null;

    try
    {
        const config = JSON.parse(str);

        if (isConfigValue(config))
            return config;

        console.log('invalid config value', str);
        return null;
    }
    catch (ex)
    {
        console.log('failed to parse config value', str, ex);
        return null;
    }
}

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

        metadata.getter = () => this.values[key];
        metadata.setter = value => this.setValue(key, value);
        metadata.subscriber = this.createSubscriber(key);

        if (metadata.persistent)
        {
            metadata.persistenceKey = metadata.version === 1 ? key : `${key}_v${metadata.version}`
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

    getMetadata(key)
    {
        const result = this.metadata[key];
        if (!result)
            throw new Error(`Unknown setting '${key}'`);
        return result;
    }

    setValue(key, value)
    {
        const metadata = this.getMetadata(key);

        if (value === undefined)
            throw new Error(`Attempt to set '${key}' to undefined`);

        if (isEqual(value, this.values[key]))
            return;

        this.values[key] = Object.freeze(structuredClone(value));

        if (metadata.persistent)
            this.save();

        this.emit(key);
        this.emit('change');
    }

    async getDefaultValue(key)
    {
        const metadata = this.getMetadata(key);

        let defaultValue;

        if (metadata.persistent)
        {
            const defaultConfig = await this.client.getClientConfig(clientConfigKey);

            if (isConfigValue(defaultConfig))
            {
                this.migrateConfig(defaultConfig);
                defaultValue = defaultConfig[metadata.persistenceKey];
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
                result[metadata.persistenceKey] = metadata.defaultValue;
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
            if (!metadata.persistent)
                continue;

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
        return this.load() ? Promise.resolve() : this.resetToDefault();
    }

    load()
    {
        const config = parseConfig(this.store.getItem(storageKey));
        if (!config)
            return false;

        this.migrateConfig(config)
        this.loadFromObject(config);
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
        const defaults = this.getDefaultValuesFromCode();

        if (isConfigValue(config))
        {
            this.migrateConfig(config);
            this.loadFromObject({...defaults, ...config});
        }
        else
        {
            this.loadFromObject(defaults);
        }

        this.save();
    }

    clearSavedDefault()
    {
        return this.client.removeClientConfig(clientConfigKey);
    }

    finishConstruction()
    {
        Object.freeze(this.metadata);
        Object.seal(this.values);
        Object.seal(this);
    }

    migrateConfig(config)
    {
        for (let key in this.metadata)
        {
            const metadata = this.metadata[key];
            if (!metadata.persistent || !metadata.migrator || config[metadata.persistenceKey] !== undefined)
                continue;

            const migratedValue = metadata.migrator(config);
            if (migratedValue !== undefined)
                config[metadata.persistenceKey] = migratedValue;
        }
    }
}
