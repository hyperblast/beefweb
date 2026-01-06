import React from 'react';
import { PanelHeaderTab, Select } from './elements.js';
import { SettingsView } from './navigation_model.js';
import ModelBinding from './model_binding.js';
import urls from './urls.js';
import ColumnsSettingsMenu from './columns_settings_menu.js';
import ServiceContext from './service_context.js';
import { MediaSize } from './settings_model.js';

const settingsViews = [
    {
        id: SettingsView.general,
        name: 'General',
    },
    {
        id: SettingsView.columns,
        name: 'Columns',
    },
    {
        id: SettingsView.output,
        name: 'Output',
    },
    {
        id: SettingsView.defaults,
        name: 'Defaults',
    },
    {
        id: SettingsView.about,
        name: 'About'
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
        this.handleSelectView = this.handleSelectView.bind(this);
    }

    getStateFromModel()
    {
        const { settingsView } = this.context.navigationModel;
        const { mediaSize } = this.context.settingsModel;
        return { settingsView, mediaSize };
    }

    handleSelectView(e)
    {
        this.context.navigationModel.setSettingsView(e.target.value);
    }

    renderSelector(settingsView)
    {
        return <div className='header-block header-block-primary'>
            <Select id='settings-page-selector'
                    className='header-selector'
                    items={settingsViews}
                    selectedItemId={settingsView}
                    onChange={this.handleSelectView}></Select>
        </div>;
    }

    renderTabs(settingsView)
    {
        const tabs = settingsViews.map(value => (
            <PanelHeaderTab
                key={value.id}
                active={settingsView === value.id}
                href={urls.settingsView(value.id)}
                title={value.name} />
        ));

        return <ul className='header-block header-block-primary'>
            { tabs }
        </ul>;
    }

    render()
    {
        const { settingsView, mediaSize } = this.state;

        const Menu = settingsMenus[settingsView];
        const menu = Menu ? <Menu/> : null;

        const mainBlock =
            mediaSize === MediaSize.small
                ? this.renderSelector(settingsView)
                : this.renderTabs(settingsView)

        return (
            <div className='panel panel-header'>
                { mainBlock }
                { menu }
            </div>
        );
    }
}

export default ModelBinding(SettingsHeader, {
    navigationModel: 'settingsViewChange',
    settingsModel: 'mediaSize'
});
