import startsWith from 'lodash/startsWith'
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
    constructor(settingsModel)
    {
        this.settingsModel = settingsModel;
    }

    start()
    {
        this.settingsModel.on('change', this.handleUpdate.bind(this));
        this.handleUpdate();
    }

    handleUpdate()
    {
        const rootElement = document.documentElement;

        const classNames = rootElement.className
            .split(' ')
            .filter(i => i !== '' && !startsWith(i, settingClassPrefix));

        const values = this.settingsModel.values;

        for (let prop of Object.getOwnPropertyNames(values))
        {
            let value = values[prop];

            if (value !== undefined)
                classNames.push(makeSettingClass(prop, value));
        }

        rootElement.className = classNames.join(' ');
    }
}
