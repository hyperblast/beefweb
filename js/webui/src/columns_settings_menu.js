import React from 'react';
import { DropdownButton } from './dropdown.js';
import { bindHandlers } from './utils.js';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './elements.js';
import { lineBreak, playlistColumns } from './columns.js';
import ServiceContext from "./service_context.js";
import { MediaSize } from './settings_model.js';
import ModelBinding from './model_binding.js';

const predefinedColumns = [
    playlistColumns.artist,
    playlistColumns.album,
    playlistColumns.track,
    playlistColumns.title,
    playlistColumns.duration,
    playlistColumns.date,
];

const layouts = [
    { id: MediaSize.small, title: 'Small'},
    { id: MediaSize.medium, title: 'Medium'},
    { id: MediaSize.large, title: 'Large'},
];

class ColumnsSettingsMenu extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = { addMenuOpen: false, settingsMenuOpen: false, ...this.getStateFromModel() };
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { layout } = this.context.columnsSettingsModel;
        const { mediaSize } = this.context.settingsModel;
        return { layout, mediaSize };
    }

    handleAddMenuRequestOpen(value)
    {
        this.setState({ addMenuOpen: value });
    }

    handleSettingsMenuRequestOpen(value)
    {
        this.setState({ settingsMenuOpen: value });
    }

    handleRevertChanges()
    {
        this.context.columnsSettingsModel.revertChanges();
    }

    handleResetToDefault()
    {
        this.context.columnsSettingsModel.resetToDefault();
    }

    handleAddLinebreak()
    {
        this.context.columnsSettingsModel.addColumn(lineBreak);
    }

    setLayout(layout)
    {
        this.context.columnsSettingsModel.setLayout(layout);
    }

    addPredefinedColumn(index)
    {
        this.context.columnsSettingsModel.addColumn(predefinedColumns[index]);
    }

    render()
    {
        const { addMenuOpen, settingsMenuOpen, layout, mediaSize } = this.state;

        const addMenuItems = predefinedColumns.map((c, i) =>
            <MenuItem
                key={i}
                title={c.title}
                onClick={() => this.addPredefinedColumn(i)} />
        );

        addMenuItems.push(<MenuSeparator key={-1} />);
        addMenuItems.push(<MenuItem key={-2} title='Add line break' onClick={this.handleAddLinebreak}/>);

        const layoutMenuItems = layouts.map(i =>
            <MenuItem
                key={i.id}
                title={i.title + (i.id === mediaSize ? ' [current]' : '')}
                checked={i.id === layout}
                onClick={() => this.setLayout(i.id)} />
        );

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    <DropdownButton
                        title='Add'
                        iconName='plus'
                        direction='left'
                        isOpen={addMenuOpen}
                        onRequestOpen={this.handleAddMenuRequestOpen}>
                        <MenuLabel title='Add column' />
                        <Menu>
                            { addMenuItems }
                        </Menu>
                    </DropdownButton>
                    <DropdownButton
                        title='Columns settings'
                        iconName='menu'
                        direction='left'
                        isOpen={settingsMenuOpen}
                        onRequestOpen={this.handleSettingsMenuRequestOpen}>
                        <Menu>
                            <MenuLabel title='Layout'/>
                            { layoutMenuItems }
                            <MenuSeparator />
                            <MenuItem title='Revert changes' onClick={this.handleRevertChanges} />
                            <MenuSeparator />
                            <MenuItem title='Reset to default' onClick={this.handleResetToDefault} />
                        </Menu>
                    </DropdownButton>
                </div>
            </div>
        )
    }
}

export default ModelBinding(ColumnsSettingsMenu, {
    settingsModel: 'mediaSize',
    columnsSettingsModel: 'change',
});
