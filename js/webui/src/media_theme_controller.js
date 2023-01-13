import { UITheme } from "./settings_model";

export default class MediaThemeController
{
    constructor(settingsModel)
    {
        this.settingsModel = settingsModel;
        this.darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.update = this.update.bind(this);
    }

    start()
    {
        this.settingsModel.on('uiThemePreferenceChange', this.update);
        this.darkThemeQuery.addEventListener('change', this.update);
        this.update();
    }

    update()
    {
        this.settingsModel.uiTheme = this.settingsModel.uiThemePreference === UITheme.system
            ? (this.darkThemeQuery.matches ? UITheme.dark : UITheme.light)
            : this.settingsModel.uiThemePreference;
    }
}
