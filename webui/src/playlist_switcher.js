import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model'
import { IconLink } from './elements'
import urls from './urls'

export default class PlaylistSwitcher extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
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
            currentPlaylistId: model.currentPlaylistId
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
        var playlists = this.state.playlists;
        var currentId = this.state.currentPlaylistId;

        var tabs = playlists.map(p => (
            <a
                href={urls.viewPlaylist(p.id)}
                key={p.id}
                title={p.title}
                className={p.id == currentId ? 'active' : null}>
                {p.title}
            </a>
        ));

        var buttonBar = (
            <div key='buttons' className='button-bar'>
                <IconLink name='plus' href='#' title='Add playlist' onClick={this.handleAddClick} />
                <IconLink name='minus' href='#' title='Remove playlist' onClick={this.handleRemoveClick} />
                <IconLink name='comment-square' href='#' title='Rename playlist' onClick={this.handleRenameClick} />
                <IconLink name='browser' href='#' title='Clear playlist' onClick={this.handleClearClick} />
                <IconLink name='external-link' href='#' title='Add URL' onClick={this.handleAddUrlClick} />
            </div>
        );

        tabs.push(buttonBar);

        return <div className='panel-header tabs'>{ tabs }</div>;
    }
}

PlaylistSwitcher.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};
