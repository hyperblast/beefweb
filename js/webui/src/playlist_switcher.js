import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types'
import { PlaybackState } from 'beefweb-client'
import { Select } from './elements.js';
import urls from './urls.js'
import { makeClassName } from './dom_utils.js';
import { defineModelData, useOverflowDetection, usePlaylistModel } from './hooks.js';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SimpleSortableContext, useDefaultSensors } from './sortable.js';

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

function PlaylistTab(props)
{
    const { playlist, isCurrent, isActive, ref } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: playlist.id });

    const setRef = useCallback(
        value => {
            setNodeRef(value);
            if (ref)
                ref.current = value;
        },
        [setNodeRef, ref])

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const className = makeClassName({
        'header-tab': true,
        'header-tab-selected': isCurrent,
        'header-tab-playing': isActive,
    });

    return (
        <li className={className}  ref={setRef} style={style} {...attributes} {...listeners}>
            <a href={urls.viewPlaylist(playlist.id)} title={playlist.title}>
                {playlist.title}
            </a>
        </li>
    );
}

PlaylistTab.propTypes = {
    playlist: PropTypes.object.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
};

export function TabbedPlaylistSwitcher()
{
    const sensors = useDefaultSensors();

    const model = usePlaylistModel();
    const { playlists, activePlaylistId, currentPlaylistId, allowChange } = usePlaylistsData();
    const currentPlaylistRef = useRef();
    const [overflow, playlistTabs] = useOverflowDetection([playlists]);

    useLayoutEffect(
        () => {
            if (currentPlaylistRef.current)
                currentPlaylistRef.current.scrollIntoView();
        },
        [currentPlaylistId]);

    const handleDragEnd = useCallback(e => model.movePlaylist(e.active.id, e.over.id), []);

    const tabs = playlists.map(p => (
        <PlaylistTab
            key={p.id}
            ref={p.id === currentPlaylistId ? currentPlaylistRef : null}
            playlist={p}
            isCurrent={p.id === currentPlaylistId}
            isActive={p.id === activePlaylistId}/>
    ));

    const className = makeClassName([
        'header-block',
        'header-block-primary',
        overflow ? 'header-block-overflow' : null
    ]);

    return (
        <SimpleSortableContext sensors={sensors} items={playlists} onDragEnd={handleDragEnd} disabled={!allowChange}>
            <ul className={className} ref={playlistTabs}>
                {tabs}
            </ul>
        </SimpleSortableContext>);
}