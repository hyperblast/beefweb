import React from 'react';
import PropTypes from 'prop-types'
import ColumnsSettingsModel from './columns_settings_model.js';
import { DropdownButton } from './dropdown.js';
import { bindHandlers } from './utils.js';
import { MenuItem, MenuLabel, MenuSeparator } from './elements.js';
import { allColumns, Visibility } from './columns.js';

export default class ColumnsSettingsMenu extends React.PureComponent
{
    constructor(props)
    {
        super(props);
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
        this.props.columnsSettingsModel.revertChanges();
    }

    handleResetToDefault(e)
    {
        this.props.columnsSettingsModel.resetToDefault();
    }

    addStandardColumn(index)
    {
        const column = Object.assign({}, allColumns[index], { visibility: Visibility.always });
        this.props.columnsSettingsModel.addColumn(column);
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
                        <MenuItem title='Reset to default' onClick={this.handleResetToDefault} />
                    </DropdownButton>
                </div>
            </div>
        )
    }
}

ColumnsSettingsMenu.propTypes = {
    columnsSettingsModel: PropTypes.instanceOf(ColumnsSettingsModel).isRequired,
};

