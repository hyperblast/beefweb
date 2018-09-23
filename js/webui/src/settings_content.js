import React from 'react';
import PropTypes from 'prop-types'
import NavigationModel, { SettingsView } from './navigation_model';
import ModelBinding from './model_binding';
import GeneralSettings from './general_settings';
import SettingsModel from './settings_model';

class SettingsContent extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.renderView = {
            [SettingsView.general]: this.renderGeneral,
            [SettingsView.columns]: this.renderColumns,
        };
    }

    getStateFromModel()
    {
        const { settingsView } = this.props.navigationModel;
        return { settingsView };
    }

    renderGeneral()
    {
        return <GeneralSettings settingsModel={this.props.settingsModel} />;
    }

    renderColumns()
    {
        return null;
    }

    render()
    {
        const { settingsView } = this.state;
        
        return (
            <div className={'panel main-panel settings settings-' + settingsView}>
                { this.renderView[settingsView].call(this) }
            </div>
        )
    }
}

SettingsContent.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
};

export default ModelBinding(SettingsContent, { navigationModel: 'settingsViewChange' });
