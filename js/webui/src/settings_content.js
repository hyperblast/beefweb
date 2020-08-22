import React from 'react';
import PropTypes from 'prop-types'
import NavigationModel, { SettingsView } from './navigation_model';
import ModelBinding from './model_binding';
import GeneralSettings from './general_settings';
import SettingsModel from './settings_model';
import ColumnsSettings from './columns_settings';
import ColumnsSettingsModel from './columns_settings_model';
import ServiceContext from './service_context';

class SettingsContent extends React.PureComponent
{
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

SettingsContent.contextType = ServiceContext;

export default ModelBinding(SettingsContent, {
    navigationModel: 'settingsViewChange'
});
