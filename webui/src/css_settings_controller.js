import startsWith from 'lodash/startsWith'
import SettingsModel, { MediaSize } from './settings_model'

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

        this.addSettingClasses(classNames);
        this.addMediaSizeClasses(classNames);

        rootElement.className = classNames.join(' ');
    }

    addSettingClasses(classNames)
    {
        const values = this.settingsModel.values;

        for (let key of Object.keys(values))
        {
            let value = values[key];

            if (value !== undefined)
                classNames.push(makeSettingClass(key, value));
        }
    }

    addMediaSizeClasses(classNames)
    {
        for (let size of Object.keys(MediaSize))
        {
            if (this.settingsModel.mediaSizeUp(size))
                classNames.push(`${settingClassPrefix}mediasize-${size}-up`);

            if (this.settingsModel.mediaSizeDown(size))
                classNames.push(`${settingClassPrefix}mediasize-${size}-down`);
        }
    }
}
