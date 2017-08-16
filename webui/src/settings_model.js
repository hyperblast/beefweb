import EventEmitter from 'wolfy87-eventemitter'

const storageKey = 'player_settings';

export const FontSize = Object.freeze({
    small: 'small',
    normal: 'normal',
    large: 'large'
});

const defaultSettings = Object.freeze({
    fullWidth: false,
    fontSize: FontSize.normal
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
    constructor()
    {
        super();

        this.values = {};
        defineSettingProperties(this);
        this.defineEvent('change');
        window.addEventListener('storage', this.load.bind(this));
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
        var data = localStorage.getItem(storageKey);
        this.values = data ? JSON.parse(data) : Object.assign({}, defaultSettings);
        this.emit('change');
    }

    save()
    {
        localStorage.setItem(storageKey, JSON.stringify(this.values));
    }
}
