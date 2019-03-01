import React from 'react'
import PropTypes from 'prop-types'
import SettingsModel from './settings_model'
import SettingEditor from './setting_editor';

export default function GeneralSettings(props)
{
    const model = props.settingsModel;

    return (
        <form>
            <SettingEditor settingKey='fullWidth' settingsModel={model} />
            <SettingEditor settingKey='fontSize' settingsModel={model} />
            <SettingEditor settingKey='inputMode' settingsModel={model} />
            <SettingEditor settingKey='showPlaybackInfo' settingsModel={model} />
        </form>
    );
}

GeneralSettings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};
