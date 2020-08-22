import React from 'react'
import SettingEditor from './setting_editor';
import ModelBinding from './model_binding';
import ServiceContext from './service_context';

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
            showPlaybackInfo
        };
    }

    render()
    {
        const model = this.context.settingsModel;
        const { showPlaybackInfo } = this.state;

        return (
            <form>
                <SettingEditor settingKey='windowTitleExpression' />
                <SettingEditor settingKey='fullWidth' />
                <SettingEditor settingKey='fontSize' />
                <SettingEditor settingKey='inputMode' />
                <SettingEditor settingKey='showPlaybackInfo' />
                <SettingEditor settingKey='playbackInfoExpression' disabled={!showPlaybackInfo} />
            </form>
        );
    }
}

GeneralSettings.contextType = ServiceContext;

export default ModelBinding(GeneralSettings, {
    settingsModel: 'showPlaybackInfoChange',
});
