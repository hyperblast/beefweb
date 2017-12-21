import React from 'react'
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import PlaylistModel from './playlist_model'
import TouchSupport from './touch_support'
import { Icon, Button, Dropdown, Menu, MenuItem, MenuSeparator } from './elements'
import { ConfirmDialog, InputDialog } from './dialogs'
import urls from './urls'
import { bindHandlers } from './utils'

const PlaylistTabHandle = SortableHandle(() => (
    <Icon name='ellipses' className='drag-handle' />
));

const PlaylistTab = SortableElement(props => {
    const { playlist: p, currentId, drawHandle } = props;
    const handle = drawHandle ? <PlaylistTabHandle /> : null;
    const className = 'header-tab' + (p.id == currentId ? ' active' : '');

    return (
        <li className={className}>
            { handle }
            <a href={urls.viewPlaylist(p.id)} title={p.title}>
                {p.title}
            </a>
        </li>
    );
});

const PlaylistTabList = SortableContainer(props => {
    const { playlists, currentId, drawHandle } = props;

    return (
        <ul className='header-block header-block-primary'>
        {
            playlists.map(p => (
                <PlaylistTab
                    key={p.id}
                    index={p.index}
                    playlist={p}
                    currentId={currentId}
                    drawHandle={drawHandle} />
            ))
        }
        </ul>
    );
});

export default class PlaylistSwitcher extends React.PureComponent
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
        const {
            playlists,
            currentPlaylistId,
            currentPlaylist,
        } = this.props.playlistModel;

        const touchMode = this.props.touchSupport.isEnabled;

        return {
            playlists,
            currentPlaylistId,
            currentPlaylist: currentPlaylist || {},
            touchMode,
        };
    }

    componentDidMount()
    {
        this.props.playlistModel.on('playlistsChange', this.handleUpdate);
        this.props.touchSupport.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playlistModel.off('playlistsChange', this.handleUpdate);
        this.props.touchSupport.off('change', this.handleUpdate);
    }

    handleSortEnd(e)
    {
        this.props.playlistModel.movePlaylist(e.oldIndex, e.newIndex);
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
            playlists,
            currentPlaylistId,
            currentPlaylist,
            touchMode,
            addUrlDialogOpen,
            renameDialogOpen,
            clearDialogOpen,
            removeDialogOpen,
        } = this.state;

        const playlistTabs = (
            <PlaylistTabList
                playlists={playlists}
                currentId={currentPlaylistId}
                onSortEnd={this.handleSortEnd}
                axis='x'
                lockAxis='x'
                helperClass='dragged'
                distance={touchMode ? null : 30}
                useDragHandle={touchMode}
                drawHandle={touchMode} />
        );

        const playlistMenu = (
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

        const buttonBar = (
            <div className='header-block'>
                <div className='button-bar'>
                    {playlistMenu}
                </div>
            </div>
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
            <div className='panel-header'>
                { playlistTabs }{ buttonBar }{ dialogs }
            </div>
        );
    }
}

PlaylistSwitcher.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    touchSupport: PropTypes.instanceOf(TouchSupport).isRequired
};
