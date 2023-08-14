import React from 'react'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { PlaybackState } from 'beefweb-client'
import { Icon } from './elements.js'
import urls from './urls.js'
import { bindHandlers } from './utils.js'
import { makeClassName } from './dom_utils.js'
import ModelBinding from './model_binding.js';
import ServiceContext from "./service_context.js";

const playbackStateIcons = {
    [PlaybackState.playing]: 'media-play',
    [PlaybackState.paused]: 'media-pause',
    [PlaybackState.stopped]: 'none',
};

function PlaylistTabHandle_()
{
    return (
        <Icon name='ellipses' className='drag-handle' />
    );
}

const PlaylistTabHandle = SortableHandle(PlaylistTabHandle_);

class PlaylistTab_ extends React.PureComponent
{
    componentDidMount()
    {
        const { playlist, currentPlaylistId } = this.props;

        if (playlist.id === currentPlaylistId)
            this.element.scrollIntoView();
    }

    render()
    {
        const {
            playlist: p,
            playbackState,
            activePlaylistId,
            currentPlaylistId,
            drawHandle
        } = this.props;

        const className = makeClassName({
            'header-tab': true,
            'header-tab-with-icon': true,
            'header-tab-active': p.id === currentPlaylistId,
            'header-tab-playing': playbackState !== PlaybackState.stopped && p.id === activePlaylistId,
        });

        const handle = drawHandle ? <PlaylistTabHandle /> : null;

        return (
            <li className={className} ref={el => this.element = el}>
                {handle}
                <a href={urls.viewPlaylist(p.id)} title={p.title}>
                    {p.title}
                </a>
            </li>
        );
    }
}

const PlaylistTab = SortableElement(PlaylistTab_);

function PlaylistTabList_(props)
{
    const {
        playbackState,
        activePlaylistId,
        currentPlaylistId,
        playlists,
        drawHandle
    } = props;

    return (
        <ul className='header-block header-block-primary'>
            {
                playlists.map(p => (
                    <PlaylistTab
                        key={p.id}
                        index={p.index}
                        playlist={p}
                        playbackState={playbackState}
                        activePlaylistId={activePlaylistId}
                        currentPlaylistId={currentPlaylistId}
                        drawHandle={drawHandle} />
                ))
            }
        </ul>
    );
}

const PlaylistTabList = SortableContainer(PlaylistTabList_);

class PlaylistSwitcher extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState, activeItem } = this.context.playerModel;
        const activePlaylistId = activeItem.playlistId;

        const { currentPlaylistId, playlists } = this.context.playlistModel;
        const { touchMode } = this.context.settingsModel;

        return {
            playbackState,
            activePlaylistId,
            currentPlaylistId,
            playlists,
            touchMode
        };
    }

    handleSortEnd(e)
    {
        this.context.playlistModel.movePlaylist(e.oldIndex, e.newIndex);
    }

    render()
    {
        const {
            playbackState,
            activePlaylistId,
            currentPlaylistId,
            playlists,
            touchMode
        } = this.state;

        return (
            <PlaylistTabList
                playbackState={playbackState}
                activePlaylistId={activePlaylistId}
                currentPlaylistId={currentPlaylistId}
                playlists={playlists}
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

export default ModelBinding(PlaylistSwitcher, {
    playerModel: 'change',
    playlistModel: 'playlistsChange',
    settingsModel: 'touchModeChange',
});
