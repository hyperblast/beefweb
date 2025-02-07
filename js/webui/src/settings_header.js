import React from 'react';
import { PanelHeaderTab } from './elements.js';
import { SettingsView } from './navigation_model.js';
import ModelBinding from './model_binding.js';
import urls from './urls.js';
import ColumnsSettingsMenu from './columns_settings_menu.js';
import ServiceContext from './service_context.js';

const settingsTabs = [
    {
        key: SettingsView.general,
        title: 'General',
    },
    {
        key: SettingsView.columns,
        title: 'Columns',
    },
    {
        key: SettingsView.defaults,
        title: 'Defaults',
    },
    {
        key: SettingsView.about,
        title: 'About'
    }
];

const settingsMenus = {
    [SettingsView.columns]: ColumnsSettingsMenu,
};

class SettingsHeader extends React.PureComponent
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

        const tabs = settingsTabs.map(value => (
            <PanelHeaderTab
                key={value.key}
                active={settingsView === value.key}
                href={urls.viewSettings(value.key)}
                title={value.title} />
        ));

        const Menu = settingsMenus[settingsView];
        const menu = Menu ? <Menu/> : null;

        return (
            <div className='panel panel-header'>
                <ul className='header-block header-block-primary'>
                    { tabs }
                </ul>
                { menu }
            </div>
        );
    }
}

export default ModelBinding(SettingsHeader, {
    navigationModel: 'settingsViewChange'
});
