import EventEmitter from 'wolfy87-eventemitter'
import SettingsStore from './settings_store.js'

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

const defaultSettings = Object.freeze({
    fullWidth: false,
    fontSize: FontSize.normal,
    inputMode: InputMode.auto
});

function defineSettingProperties(obj)
{
    for (let key of Object.keys(defaultSettings))
    {
        Object.defineProperty(obj, key, {
            enumerable: true,
            get: function() { return this.get(key); },
            set: function(value) { this.set(key, value); }
        });
    }
}

export default class SettingsModel extends EventEmitter
{
    constructor(store)
    {
        super();

        this.store = store;
        this.values = {};

        defineSettingProperties(this);
        this.defineEvent('change');
        this.store.on('refresh', this.load.bind(this));
    }

    set(key, value)
    {
        this.values[key] = value;
        this.save();
        this.emit('change');
    }

    get(key)
    {
        return this.values[key];
    }

    load()
    {
        var data = this.store.getItem(storageKey);
        this.values = data ? JSON.parse(data) : Object.assign({}, defaultSettings);
        this.emit('change');
    }

    save()
    {
        this.store.setItem(storageKey, JSON.stringify(this.values));
    }
}
