import React from 'react'
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import Component from './component'
import PlaylistModel from './playlist_model'
import SettingsModel from './settings_model'
import { Icon } from './elements'
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

export default class PlaylistSwitcher extends Component
{
    constructor(props)
    {
        super(props);

        this.bindEvents({
            playlistModel: 'playlistsChange',
            settingsModel: 'touchModeChange',
        });

        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { currentPlaylistId, playlists } = this.props.playlistModel;
        const { touchMode } = this.props.settingsModel;
        return { currentPlaylistId, playlists, touchMode };
    }

    handleSortEnd(e)
    {
        this.props.playlistModel.movePlaylist(e.oldIndex, e.newIndex);
    }

    render()
    {
        const { currentPlaylistId, playlists, touchMode } = this.state;

        return (
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
    }
}

PlaylistSwitcher.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};
