import React from 'react';
import PropTypes from 'prop-types'
import ColumnsSettingsModel from './columns_settings_model';
import { DropdownButton } from './dropdown';
import { bindHandlers } from './utils';
import { MenuItem, MenuLabel, MenuSeparator } from './elements';
import { allColumns, Visibility } from './columns';

export default class ColumnsSettingsMenu extends React.PureComponent
{
    constructor(props)
    {
        super(props);
        this.state = { menuOpen: false };
        bindHandlers(this);
    }

    handleMenuRequestOpen(value)
    {
        this.setState({ menuOpen: value });
    }

    handleRevertChanges(e)
    {
        e.preventDefault();
        this.props.columnsSettingsModel.revertChanges();
    }

    handleResetToDefault(e)
    {
        e.preventDefault();
        this.props.columnsSettingsModel.resetToDefault();
    }

    addStandardColumn(e, index)
    {
        e.preventDefault();
        const column = Object.assign({}, allColumns[index], { visibility: Visibility.always });
        this.props.columnsSettingsModel.addColumn(column);
    }

    render()
    {
        const { menuOpen } = this.state;

        const addColumnMenuItems = allColumns.map((c, i) =>
            <MenuItem
                key={i}
                title={c.title}
                onClick={e => this.addStandardColumn(e, i)} />
        );

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    <DropdownButton
                        title='Columns menu'
                        iconName='menu'
                        direction='left'
                        isOpen={menuOpen}
                        onRequestOpen={this.handleMenuRequestOpen}>
                        <MenuItem title='Revert changes' onClick={this.handleRevertChanges} />
                        <MenuItem title='Reset to default' onClick={this.handleResetToDefault} />
                        <MenuSeparator />
                        <MenuLabel title='Add column' />
                        { addColumnMenuItems }
                    </DropdownButton>
                </div>
            </div>
        )
    }
}

ColumnsSettingsMenu.propTypes = {
    columnsSettingsModel: PropTypes.instanceOf(ColumnsSettingsModel).isRequired,
};

