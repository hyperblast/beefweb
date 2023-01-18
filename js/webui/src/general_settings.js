import React from 'react'
import SettingEditor from './setting_editor.js';
import ModelBinding from './model_binding.js';
import ServiceContext from './service_context.js';
import { MediaSize } from './settings_model.js';

class GeneralSettings extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { showPlaybackInfo } = this.context.settingsModel;

        return {
            showPlaybackInfo,
            showFullWidth: this.context.settingsModel.mediaSizeUp(MediaSize.large),
        };
    }

    render()
    {
        const { showPlaybackInfo, showFullWidth } = this.state;

        return (
            <form className='settings-form'>
                <SettingEditor settingKey='uiThemePreference' />
                <SettingEditor settingKey='windowTitleExpression' />
                {
                    showFullWidth ? <SettingEditor settingKey='fullWidth' /> : null
                }
                <SettingEditor settingKey='fontSize' />
                <SettingEditor settingKey='inputMode' />
                <SettingEditor settingKey='defaultAddAction' />
                <SettingEditor settingKey='showPlaybackInfo' />
                <SettingEditor settingKey='playbackInfoExpression' disabled={!showPlaybackInfo} />
            </form>
        );
    }
}

GeneralSettings.contextType = ServiceContext;

export default ModelBinding(GeneralSettings, {
    settingsModel: ['showPlaybackInfoChange', 'mediaSizeChange'],
});
