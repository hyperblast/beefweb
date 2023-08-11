import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model.js'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './elements.js'
import { ConfirmDialog, InputDialog } from './dialogs.js'
import { bindHandlers } from './utils.js'
import ModelBinding from './model_binding.js';
import { DropdownButton } from './dropdown.js';
import SettingsModel, { AddAction } from './settings_model.js';
import { sortMenuColumns } from './columns.js';
import ServiceContext from "./service_context.js";

class PlaylistMenu extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = Object.assign(this.getStateFromModel(), {
            menuOpen: false,
            removeDialogOpen: false,
            clearDialogOpen: false,
            addUrlDialogOpen: false,
            addUrlDialogValue: '',
            renameDialogOpen: false,
            renameDialogValue: '',
            sortDialogOpen: false,
            sortDialogValue: '',
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { currentPlaylistId, currentPlaylist } = this.context.playlistModel;

        return {
            currentPlaylistId,
            currentPlaylist: currentPlaylist || {},
        };
    }

    handleMenuRequestOpen(value)
    {
        this.setState({ menuOpen: value });
    }

    handleAddClick()
    {
        this.context.playlistModel.addPlaylist();
    }

    handleRemoveClick()
    {
        this.setState({ removeDialogOpen: true });
    }

    handleRemoveOk()
    {
        this.setState({ removeDialogOpen: false });
        this.context.playlistModel.removePlaylist();
    }

    handleRemoveCancel()
    {
        this.setState({ removeDialogOpen: false });
    }

    handleRenameClick()
    {
        this.setState({
            renameDialogOpen: true,
            renameDialogValue: this.state.currentPlaylist.title
        });
    }

    handleRenameUpdate(value)
    {
        this.setState({ renameDialogValue: value });
    }

    handleRenameOk()
    {
        this.setState({ renameDialogOpen: false });

        const oldTitle = this.state.currentPlaylist.title;
        const newTitle = this.state.renameDialogValue;

        if (oldTitle !== newTitle)
            this.context.playlistModel.renamePlaylist(newTitle);
    }

    handleRenameCancel()
    {
        this.setState({ renameDialogOpen: false });
    }

    handleClearClick()
    {
        this.setState({ clearDialogOpen: true });
    }

    handleClearOk()
    {
        this.setState({ clearDialogOpen: false });
        this.context.playlistModel.clearPlaylist();
    }

    handleClearCancel()
    {
        this.setState({ clearDialogOpen: false });
    }

    handleAddUrlClick()
    {
        this.setState({
            addUrlDialogOpen: true,
            addUrlDialogValue: ''
        });
    }

    handleAddUrlUpdate(value)
    {
        this.setState({ addUrlDialogValue: value });
    }

    handleAddUrlOk()
    {
        this.setState({ addUrlDialogOpen: false });

        const url = this.state.addUrlDialogValue.trim();

        if (url)
            this.context.playlistModel.addItems([ url ], AddAction.add);
    }

    handleAddUrlCancel()
    {
        this.setState({ addUrlDialogOpen: false });
    }

    handleSortClick()
    {
        this.setState({
            sortDialogOpen: true,
            sortDialogValue: this.context.settingsModel.customSortBy,
        });
    }

    handleSortOk()
    {
        this.setState({ sortDialogOpen: false });

        const expression = this.state.sortDialogValue;

        this.context.playlistModel.sortPlaylist(expression);
        this.context.settingsModel.customSortBy = expression;
    }

    handleSortCancel()
    {
        this.setState({ sortDialogOpen: false });
    }

    handleSortUpdate(value)
    {
        this.setState({ sortDialogValue: value });
    }

    sortBy(index)
    {
        this.context.playlistModel.sortPlaylist(sortMenuColumns[index]);
    }

    render()
    {
        const {
            currentPlaylist,
            menuOpen,
            clearDialogOpen,
            removeDialogOpen,
            addUrlDialogOpen,
            addUrlDialogValue,
            renameDialogOpen,
            renameDialogValue,
            sortDialogOpen,
            sortDialogValue,
        } = this.state;

        const menuItems = [
            <MenuItem key='add' title='Add playlist' onClick={this.handleAddClick} />,
            <MenuItem key='remove' title='Remove playlist' onClick={this.handleRemoveClick} />,
            <MenuSeparator key='modify' />,
            <MenuItem key='rename' title='Rename playlist' onClick={this.handleRenameClick} />,
            <MenuItem key='clear' title='Clear playlist' onClick={this.handleClearClick} />,
            <MenuItem key='addurl' title='Add URL' onClick={this.handleAddUrlClick} />,
            <MenuSeparator key='sort' />,
            <MenuLabel key='sortby' title='Sort by' />
        ];

        const menuSortItems = sortMenuColumns.map((column, index) => (
            <MenuItem
                key={'sortby' + index}
                title={column.title}
                onClick={() => this.sortBy(index)}
            />
        ));

        menuSortItems.push(
            <MenuItem key='sortcustom' title='Custom...' onClick={this.handleSortClick} />
        );

        const menu = (
            <DropdownButton
                title='Playlist menu'
                iconName='menu'
                direction='left'
                isOpen={menuOpen}
                onRequestOpen={this.handleMenuRequestOpen}>
                <Menu>
                    { menuItems } { menuSortItems }
                </Menu>
            </DropdownButton>
        );

        const dialogs = (
            <div className='dialog-placeholder'>
                <ConfirmDialog
                    title='Remove playlist'
                    message={`Do you want to remove '${currentPlaylist.title}' playlist?`}
                    isOpen={removeDialogOpen}
                    onOk={this.handleRemoveOk}
                    onCancel={this.handleRemoveCancel} />
                <ConfirmDialog
                    title='Clear playlist'
                    message={`Do you want to clear '${currentPlaylist.title}' playlist?`}
                    isOpen={clearDialogOpen}
                    onOk={this.handleClearOk}
                    onCancel={this.handleClearCancel} />
                <InputDialog
                    title='Add URL'
                    message='Add URL to playlist:'
                    isOpen={addUrlDialogOpen}
                    value={addUrlDialogValue}
                    onOk={this.handleAddUrlOk}
                    onCancel={this.handleAddUrlCancel}
                    onUpdate={this.handleAddUrlUpdate}/>
                <InputDialog
                    title='Rename playlist'
                    message='Enter new playlist name:'
                    isOpen={renameDialogOpen}
                    value={renameDialogValue}
                    onOk={this.handleRenameOk}
                    onCancel={this.handleRenameCancel}
                    onUpdate={this.handleRenameUpdate} />
                <InputDialog
                    title='Custom sort'
                    message='Enter sort expression:'
                    isOpen={sortDialogOpen}
                    value={sortDialogValue}
                    onOk={this.handleSortOk}
                    onCancel={this.handleSortCancel}
                    onUpdate={this.handleSortUpdate} />
            </div>
        );

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    { menu }{ dialogs }
                </div>
            </div>
        );
    }
}

export default ModelBinding(PlaylistMenu, { playlistModel: 'playlistsChange' });
