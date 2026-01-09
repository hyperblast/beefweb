import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types'
import { PlaybackState } from 'beefweb-client'
import { Select } from './elements.js';
import urls from './urls.js'
import { makeClassName } from './dom_utils.js'
import { defineModelData, usePlaylistModel } from './hooks.js';

const usePlaylistsData = defineModelData({
    selector(context)
    {
        const { playerModel, playlistModel } = context;
        const { playbackState, activeItem, permissions } = playerModel;
        const { currentPlaylistId, playlists } = playlistModel;

        return {
            activePlaylistId: playbackState !== PlaybackState.stopped ? activeItem.playlistId : null,
            currentPlaylistId,
            playlists,
            allowChange: permissions.changePlaylists,
        };
    },

    updateOn: {
        playerModel: 'change',
        playlistModel: 'playlistsChange',
        settingsModel: ['touchMode', 'mediaSize'],
    }
});

export function PlaylistSelector()
{
    const model = usePlaylistModel();
    const data = usePlaylistsData();
    const setCurrentPlaylist = useCallback(e => model.setCurrentPlaylistId(e.target.value), []);

    return <div className='header-block header-block-primary'>
        <Select className='header-selector'
                items={data.playlists}
                selectedItemId={data.currentPlaylistId}
                nameProperty='title'
                onChange={setCurrentPlaylist} />
    </div>;
}

const PlaylistTab = forwardRef(function PlaylistTab(props, ref)
{
    const { playlist, isCurrent, isActive } = props;

    const className = makeClassName({
        'header-tab': true,
        'header-tab-with-icon': true,
        'header-tab-active': isCurrent,
        'header-tab-playing': isActive,
    });

    return (
        <li className={className} ref={ref}>
            <a href={urls.viewPlaylist(playlist.id)} title={playlist.title}>
                {playlist.title}
            </a>
        </li>
    );
});

PlaylistTab.propTypes = {
    playlist: PropTypes.object.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
};

export function TabbedPlaylistSwitcher()
{
    const { playlists, activePlaylistId, currentPlaylistId } = usePlaylistsData();
    const currentPlaylistRef = useRef();

    useLayoutEffect(
        () => {
            if (currentPlaylistRef.current)
                currentPlaylistRef.current.scrollIntoView();
        },
        [currentPlaylistId]);

    return <ul className='header-block header-block-primary'>
        {
            playlists.map(p => (
                <PlaylistTab
                    key={p.id}
                    ref={p.id === currentPlaylistId ? currentPlaylistRef : null}
                    playlist={p}
                    isCurrent={p.id === currentPlaylistId}
                    isActive={p.id === activePlaylistId}/>
            ))
        }
    </ul>
}