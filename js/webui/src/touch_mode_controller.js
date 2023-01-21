import { primaryInput } from 'detect-it'
import EventEmitter from 'wolfy87-eventemitter'
import SettingsModel, { InputMode } from './settings_model.js'

export default class TouchModeController
{
    constructor(settingsModel)
    {
        this.settingsModel = settingsModel;
    }

    start()
    {
        this.settingsModel.on('inputModeChange', this.update.bind(this));
        this.update();
    }

    update()
    {
        this.settingsModel.touchMode = this.isTouchMode();
    }

    isTouchMode()
    {
        const { inputMode } = this.settingsModel;

        if (inputMode === InputMode.forceMouse)
            return false;

        if (inputMode === InputMode.forceTouch)
            return true;

        return primaryInput === 'touch';
    }
}
