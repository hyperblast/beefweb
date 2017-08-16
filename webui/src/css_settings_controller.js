import SettingsModel from './settings_model'

const settingClassPrefix = 'setting-';

function makeSettingClass(name, value)
{
    name = name.toLowerCase();

    if (value === true)
        return `${settingClassPrefix}${name}`;

    if (value === false)
        return `${settingClassPrefix}no-${name}`;

    value = String(value).toLowerCase();

    return `${settingClassPrefix}${name}-${value}`;
}

export default class CssSettingsController
{
    constructor(model)
    {
        this.model = model;
    }

    start()
    {
        this.model.on('change', this.handleUpdate.bind(this));
        this.handleUpdate();
    }

    handleUpdate()
    {
        var rootElement = document.documentElement;

        var classNames = rootElement.className
            .split(' ')
            .filter(i => i != '' && i.indexOf(settingClassPrefix) != 0);

        var values = this.model.values;

        for (let key in values)
        {
            let value = values[key];

            if (values.hasOwnProperty(key) && value !== undefined)
            {
                classNames.push(makeSettingClass(key, value));
            }
        }

        rootElement.className = classNames.join(' ');
    }
}
