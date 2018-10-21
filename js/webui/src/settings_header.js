import React from 'react';
import PropTypes from 'prop-types'
import { PanelHeaderTab } from './elements';
import NavigationModel, { SettingsView, SettingsViewMetadata } from './navigation_model';
import ModelBinding from './model_binding';
import urls from './urls';
import ColumnsSettingsMenu from './columns_settings_menu';
import ColumnsSettingsModel from './columns_settings_model';

class SettingsHeader extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();

        this.renderMenu = {
            [SettingsView.columns]: this.renderColumnsMenu,
        };
    }

    renderColumnsMenu()
    {
        return <ColumnsSettingsMenu columnsSettingsModel={this.props.columnsSettingsModel} />
    }

    getStateFromModel()
    {
        const { settingsView } = this.props.navigationModel;
        return { settingsView };
    }

    render()
    {
        const { settingsView } = this.state;

        const tabs = SettingsViewMetadata.map(value => (
            <PanelHeaderTab
                key={value.key}
                active={settingsView === value.key}
                href={urls.viewSettings(value.key)}
                title={value.title} />
        ));

        const renderMenu = this.renderMenu[settingsView];
        const menu = renderMenu ? renderMenu.call(this) : null;

        return (
            <div className='panel-header'>
                <ul className='header-block header-block-primary'>
                    { tabs }
                </ul>
                { menu }
            </div>
        );
    }
}

SettingsHeader.propTypes = {
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
    columnsSettingsModel: PropTypes.instanceOf(ColumnsSettingsModel).isRequired,
};

export default ModelBinding(SettingsHeader, { navigationModel: 'settingsViewChange' });
