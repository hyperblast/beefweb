import React from 'react';
import { PanelHeaderTab } from './elements.js';
import { SettingsView, SettingsViewMetadata } from './navigation_model.js';
import ModelBinding from './model_binding.js';
import urls from './urls.js';
import ColumnsSettingsMenu from './columns_settings_menu.js';
import ServiceContext from './service_context.js';

class SettingsHeader extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();

        this.renderMenu = {
            [SettingsView.columns]: this.renderColumnsMenu,
        };
    }

    getStateFromModel()
    {
        const { settingsView } = this.context.navigationModel;
        return { settingsView };
    }

    renderColumnsMenu()
    {
        return <ColumnsSettingsMenu columnsSettingsModel={this.context.columnsSettingsModel} />
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

SettingsHeader.contextType = ServiceContext;

export default ModelBinding(SettingsHeader, {
    navigationModel: 'settingsViewChange'
});
