import React from 'react';
import { DropdownButton } from './dropdown.js';
import { bindHandlers } from './utils.js';
import { MenuItem, MenuLabel, MenuSeparator } from './elements.js';
import { allColumns, Visibility } from './columns.js';
import ServiceContext from "./service_context.js";

export default class ColumnsSettingsMenu extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = { addMenuOpen: false, settingsMenuOpen: false };
        bindHandlers(this);
    }

    handleAddMenuRequestOpen(value)
    {
        this.setState({ addMenuOpen: value });
    }

    handleSettingsMenuRequestOpen(value)
    {
        this.setState({ settingsMenuOpen: value });
    }

    handleRevertChanges(e)
    {
        this.context.columnsSettingsModel.revertChanges();
    }

    handleResetToDefault(e)
    {
        this.context.columnsSettingsModel.resetToDefault();
    }

    addStandardColumn(index)
    {
        const column = Object.assign({}, allColumns[index], { visibility: Visibility.always });
        this.context.columnsSettingsModel.addColumn(column);
    }

    render()
    {
        const { addMenuOpen, settingsMenuOpen } = this.state;

        const addColumnMenuItems = allColumns.map((c, i) =>
            <MenuItem
                key={i}
                title={c.title}
                onClick={() => this.addStandardColumn(i)} />
        );

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    <DropdownButton
                        title='Add column'
                        iconName='plus'
                        direction='left'
                        isOpen={addMenuOpen}
                        onRequestOpen={this.handleAddMenuRequestOpen}>
                        <MenuLabel title='Add column' />
                        { addColumnMenuItems }
                    </DropdownButton>
                    <DropdownButton
                        title='Columns settings'
                        iconName='menu'
                        direction='left'
                        isOpen={settingsMenuOpen}
                        onRequestOpen={this.handleSettingsMenuRequestOpen}>
                        <MenuItem title='Revert changes' onClick={this.handleRevertChanges} />
                        <MenuSeparator />
                        <MenuItem title='Reset to default' onClick={this.handleResetToDefault} />
                    </DropdownButton>
                </div>
            </div>
        )
    }
}
