import detectIt from 'detect-it'
import EventEmitter from 'wolfy87-eventemitter'
import SettingsModel, { InputMode } from './settings_model'

export default class TouchSupport extends EventEmitter
{
    constructor(settings)
    {
        super();

        this.settings = settings;
        this.isEnabled = false;
        this.defineEvent('change');
    }

    start()
    {
        this.settings.on('change', this.update.bind(this));
        this.update();
    }

    update()
    {
        const wouldBeEnabled = this.detect();

        if (this.isEnabled === wouldBeEnabled)
            return;

        this.isEnabled = wouldBeEnabled;
        this.emitEvent('change');
    }

    detect()
    {
        const mode = this.settings.inputMode;

        if (mode === InputMode.forceMouse)
            return false;

        if (mode === InputMode.forceTouch)
            return true;

        return detectIt.primaryInput === 'touch';
    }
}
