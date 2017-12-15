import React from 'react'
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import PlaylistModel from './playlist_model'
import TouchSupport from './touch_support'
import { IconLink } from './elements'
import urls from './urls'

const PlaylistTab = SortableElement(state => {
    let p = state.playlist;
    let currentId = state.currentId;

    return (
        <li className={p.id == currentId ? 'tab active' : 'tab'}>
            <a href={urls.viewPlaylist(p.id)} title={p.title}>
                {p.title}
            </a>
        </li>
    );
});

const PlaylistTabList = SortableContainer(({ playlists, currentId }) => {
    return (
        <ul className='tabs'>
        {
            playlists.map(p => (
                <PlaylistTab
                    key={p.id}
                    index={p.index}
                    playlist={p}
                    currentId={currentId} />
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

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleSortEnd = this.handleSortEnd.bind(this);
        this.handleAddClick = this.handleAddClick.bind(this);
        this.handleRemoveClick = this.handleRemoveClick.bind(this);
        this.handleRenameClick = this.handleRenameClick.bind(this);
        this.handleClearClick = this.handleClearClick.bind(this);
        this.handleAddUrlClick = this.handleAddUrlClick.bind(this);
    }

    getStateFromModel()
    {
        var model = this.props.playlistModel;

        return {
            playlists: model.playlists,
            currentPlaylistId: model.currentPlaylistId,
            touchSupport: this.props.touchSupport.isEnabled,
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

        var model = this.props.playlistModel;
        var currentPlaylist = model.currentPlaylist;

        if (currentPlaylist && window.confirm(`Do you want to remove '${currentPlaylist.title}' playlist?`))
            model.removePlaylist(currentPlaylist.id);
    }

    handleRenameClick(e)
    {
        e.preventDefault();

        var model = this.props.playlistModel;
        var currentPlaylist = model.currentPlaylist;

        if (!currentPlaylist)
            return;

        var newTitle = window.prompt('Enter new playlist name:', currentPlaylist.title);

        if (newTitle && newTitle !== currentPlaylist.title)
            model.renamePlaylist(newTitle);
    }

    handleClearClick(e)
    {
        e.preventDefault();

        var model = this.props.playlistModel;
        var currentPlaylist = model.currentPlaylist;

        if (currentPlaylist && window.confirm(`Do you want to clear '${currentPlaylist.title}' playlist?`))
            model.clearPlaylist(currentPlaylist.id);
    }

    handleAddUrlClick(e)
    {
        e.preventDefault();

        var url = window.prompt('Add URL to playlist:', '');

        if (url)
            this.props.playlistModel.addItems([url.trim()]);
    }

    render()
    {
        const { playlists, currentPlaylistId: currentId, touchSupport } = this.state;

        const playlistTabs = (
            <PlaylistTabList
                key='playlists'
                playlists={playlists}
                currentId={currentId}
                onSortEnd={this.handleSortEnd}
                axis='x'
                lockAxis='x'
                helperClass='active'
                distance={touchSupport ? null : 30}
                pressDelay={touchSupport ? 200 : null} />
        );

        const buttonBar = (
            <div key='buttons' className='tabs extra'>
                <div className='tab button-bar'>
                    <IconLink name='plus' href='#' title='Add playlist' onClick={this.handleAddClick} />
                    <IconLink name='minus' href='#' title='Remove playlist' onClick={this.handleRemoveClick} />
                    <IconLink name='comment-square' href='#' title='Rename playlist' onClick={this.handleRenameClick} />
                    <IconLink name='browser' href='#' title='Clear playlist' onClick={this.handleClearClick} />
                    <IconLink name='external-link' href='#' title='Add URL' onClick={this.handleAddUrlClick} />
                </div>
            </div>
        );

        return (
            <div className='panel-header tabs-wrapper'>
                { [ playlistTabs, buttonBar ] }
            </div>
        );
    }
}

PlaylistSwitcher.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    touchSupport: PropTypes.instanceOf(TouchSupport).isRequired
};
