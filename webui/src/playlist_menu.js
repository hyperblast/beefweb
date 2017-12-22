import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model'
import { Icon, Button, Dropdown, Menu, MenuItem, MenuSeparator } from './elements'
import { ConfirmDialog, InputDialog } from './dialogs'
import { bindHandlers } from './utils'

export default class PlaylistMenu extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
            removeDialogOpen: false,
            clearDialogOpen: false,
            addUrlDialogOpen: false,
            renameDialogOpen: false,
        });

        this.handleUpdate = () => this.setState(this.getStateFromModel());

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { currentPlaylistId, currentPlaylist } = this.props.playlistModel;

        return {
            currentPlaylistId,
            currentPlaylist: currentPlaylist || {},
        };
    }

    componentDidMount()
    {
        this.props.playlistModel.on('playlistsChange', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playlistModel.off('playlistsChange', this.handleUpdate);
    }


    handleAddClick(e)
    {
        e.preventDefault();
        this.props.playlistModel.addPlaylist();
    }

    handleRemoveClick(e)
    {
        e.preventDefault();
        this.setState({ removeDialogOpen: true });
    }

    handleRemoveOk()
    {
        this.setState({ removeDialogOpen: false });
        this.props.playlistModel.removePlaylist();
    }

    handleRemoveCancel()
    {
        this.setState({ removeDialogOpen: false });
    }

    handleRenameClick(e)
    {
        e.preventDefault();
        this.setState({ renameDialogOpen: true });
    }

    handleRenameOk(newTitle)
    {
        this.setState({ renameDialogOpen: false });

        const { playlistModel } = this.props;
        const { currentPlaylist } = playlistModel;

        if (currentPlaylist && newTitle !== currentPlaylist.title)
            playlistModel.renamePlaylist(newTitle);
    }

    handleRenameCancel()
    {
        this.setState({ renameDialogOpen: false });
    }

    handleClearClick(e)
    {
        e.preventDefault();
        this.setState({ clearDialogOpen: true });
    }

    handleClearOk()
    {
        this.setState({ clearDialogOpen: false });
        this.props.playlistModel.clearPlaylist();
    }

    handleClearCancel()
    {
        this.setState({ clearDialogOpen: false });
    }

    handleAddUrlClick(e)
    {
        e.preventDefault();
        this.setState({ addUrlDialogOpen: true });
    }

    handleAddUrlOk(value)
    {
        this.setState({ addUrlDialogOpen: false });

        const url = value.trim();

        if (url)
            this.props.playlistModel.addItems([ url ]);
    }

    handleAddUrlCancel()
    {
        this.setState({ addUrlDialogOpen: false });
    }

    render()
    {
        const {
            currentPlaylistId,
            currentPlaylist,
            addUrlDialogOpen,
            renameDialogOpen,
            clearDialogOpen,
            removeDialogOpen,
        } = this.state;

        const menu = (
            <Dropdown title='Playlist menu' iconName='menu' direction='left'>
                <Menu>
                    <MenuItem title='Add playlist' onClick={this.handleAddClick} />
                    <MenuItem title='Remove playlist' onClick={this.handleRemoveClick} />
                    <MenuSeparator />
                    <MenuItem title='Rename playlist' onClick={this.handleRenameClick} />
                    <MenuItem title='Clear playlist' onClick={this.handleClearClick} />
                    <MenuItem title='Add URL' onClick={this.handleAddUrlClick} />
                </Menu>
            </Dropdown>
        );

        const dialogs = (
            <div className='dialog-placeholder'>
                <ConfirmDialog
                    message={`Do you want to remove '${currentPlaylist.title}' playlist?`}
                    isOpen={removeDialogOpen}
                    onOk={this.handleRemoveOk}
                    onCancel={this.handleRemoveCancel} />
                <ConfirmDialog
                    message={`Do you want to clear '${currentPlaylist.title}' playlist?`}
                    isOpen={clearDialogOpen}
                    onOk={this.handleClearOk}
                    onCancel={this.handleClearCancel} />
                <InputDialog
                    message='Add URL to playlist:'
                    isOpen={addUrlDialogOpen}
                    onOk={this.handleAddUrlOk}
                    onCancel={this.handleAddUrlCancel} />
                <InputDialog
                    message='Enter new playlist name:'
                    isOpen={renameDialogOpen}
                    initialValue={currentPlaylist.title}
                    onOk={this.handleRenameOk}
                    onCancel={this.handleRenameCancel} />
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

PlaylistMenu.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};