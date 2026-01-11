import { MediaSize } from './settings_model.js'
import { debounce } from './lodash.js';

const settingClassPrefix = 'st-';

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
        this.settingsModel.on('change', this.update.bind(this));
        window.addEventListener('resize', debounce(this.updateViewHeight.bind(this), 50));
        this.updateViewHeight();
        this.update();
    }

    updateViewHeight()
    {
        document.documentElement.style.setProperty('--view-height', `${window.innerHeight}px`);
    }

    update()
    {
        const rootElement = document.documentElement;

        const classNames = rootElement.className
            .split(' ')
            .filter(i => i !== '' && !i.startsWith(settingClassPrefix));

        this.addSettingClasses(classNames);
        this.addMediaSizeClasses(classNames);

        rootElement.className = classNames.join(' ');
    }

    addSettingClasses(classNames)
    {
        const { values, metadata } = this.settingsModel;

        for (let key in metadata)
        {
            if (metadata[key].cssVisible)
                classNames.push(makeSettingClass(key, values[key]));
        }
    }

    addMediaSizeClasses(classNames)
    {
        const size = MediaSize.medium;

        if (this.settingsModel.mediaSizeUp(size))
            classNames.push(`${settingClassPrefix}mediasize-${size}-up`);

        if (this.settingsModel.mediaSizeDown(size))
            classNames.push(`${settingClassPrefix}mediasize-${size}-down`);
    }
}
