import React from 'react'
import SettingEditor from './setting_editor.js';
import ModelBinding from './model_binding.js';
import ServiceContext from './service_context.js';
import { MediaSize } from './settings_model.js';

class GeneralSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { mediaSize, showPlaybackInfo } = this.context.settingsModel;
        return { mediaSize, showPlaybackInfo };
    }

    render()
    {
        const { mediaSize, showPlaybackInfo } = this.state;

        return (
            <form className='settings-form'>
                <SettingEditor settingKey='uiThemePreference' />
                <SettingEditor settingKey='uiScale' />
                <SettingEditor settingKey='compactMode' />
                <SettingEditor settingKey='windowTitleExpression' />
                {
                    mediaSize === MediaSize.large ? <SettingEditor settingKey='fullWidth' /> : null
                }
                <SettingEditor settingKey='inputMode' />
                <SettingEditor settingKey='defaultAddAction' />
                {
                    mediaSize !== MediaSize.small ? <SettingEditor settingKey='combinePlayPause' /> : null
                }
                <SettingEditor settingKey='showPlaybackInfo' />
                <SettingEditor settingKey='playbackInfoExpression' disabled={!showPlaybackInfo} />
                <SettingEditor settingKey='showStatusBar' />
            </form>
        );
    }
}

export default ModelBinding(GeneralSettings, {
    settingsModel: ['showPlaybackInfo', 'mediaSize'],
});
