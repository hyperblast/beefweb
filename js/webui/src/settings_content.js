import React from 'react';
import { SettingsView } from './navigation_model.js';
import ModelBinding from './model_binding.js';
import DefaultsSettings from './defaults_settings.js'
import GeneralSettings from './general_settings.js';
import ColumnsSettings from './columns_settings.js';
import ServiceContext from './service_context.js';
import AboutBox from './about_box.js';

const settingsViews = {
    [SettingsView.general]: GeneralSettings,
    [SettingsView.columns]: ColumnsSettings,
    [SettingsView.defaults]: DefaultsSettings,
    [SettingsView.about]: AboutBox,
};

class SettingsContent extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { settingsView } = this.context.navigationModel;
        return { settingsView };
    }

    render()
    {
        const { settingsView } = this.state;

        const View = settingsViews[settingsView];

        return (
            <div className='panel panel-main settings-content-wrapper'>
                <div className='settings-content'>
                    { View ? <View/> : null }
                </div>
            </div>
        )
    }
}

export default ModelBinding(SettingsContent, {
    navigationModel: 'settingsViewChange'
});
