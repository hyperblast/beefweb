import React from 'react'
import PropTypes from 'prop-types'
import SettingsModel from './settings_model'
import SettingEditor from './setting_editor';
import ModelBinding from './model_binding';

class GeneralSettings extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { showPlaybackInfo } = this.props.settingsModel;

        return {
            showPlaybackInfo,
        };
    }

    render()
    {
        const model = this.props.settingsModel;
        const { showPlaybackInfo } = this.state;

        return (
            <form>
                <SettingEditor settingKey='windowTitleExpression' settingsModel={model} />
                <SettingEditor settingKey='fullWidth' settingsModel={model} />
                <SettingEditor settingKey='fontSize' settingsModel={model} />
                <SettingEditor settingKey='inputMode' settingsModel={model} />
                <SettingEditor settingKey='showPlaybackInfo' settingsModel={model} />
                <SettingEditor settingKey='playbackInfoExpression' settingsModel={model} disabled={!showPlaybackInfo} />
            </form>
        );
    }
}

GeneralSettings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};


export default ModelBinding(GeneralSettings, {
    settingsModel: 'showPlaybackInfoChange',
});
