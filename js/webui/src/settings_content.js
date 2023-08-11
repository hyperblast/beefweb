import React from 'react';
import { SettingsView } from './navigation_model.js';
import ModelBinding from './model_binding.js';
import GeneralSettings from './general_settings.js';
import ColumnsSettings from './columns_settings.js';
import ServiceContext from './service_context.js';

class SettingsContent extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.renderView = {
            [SettingsView.general]: this.renderGeneral,
            [SettingsView.columns]: this.renderColumns,
        };
    }

    getStateFromModel()
    {
        const { settingsView } = this.context.navigationModel;
        return { settingsView };
    }

    renderGeneral()
    {
        return <GeneralSettings />;
    }

    renderColumns()
    {
        return <ColumnsSettings columnsSettingsModel={this.context.columnsSettingsModel} />;
    }

    render()
    {
        const { settingsView } = this.state;

        return (
            <div className='panel main-panel settings-content-wrapper'>
                <div className='settings-content'>
                    { this.renderView[settingsView].call(this) }
                </div>
            </div>
        )
    }
}

export default ModelBinding(SettingsContent, {
    navigationModel: 'settingsViewChange'
});
