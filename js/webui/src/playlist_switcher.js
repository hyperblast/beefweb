import React, { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types'
import { PlaybackState } from 'beefweb-client'
import { Select } from './elements.js';
import urls from './urls.js'
import { makeClassName } from './dom_utils.js'
import { defineModelData, usePlaylistModel } from './hooks.js';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const PlaylistTab = forwardRef(function PlaylistTab(props, ref)
{
    const { playlist, isCurrent, isActive } = props;

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
        'header-tab-with-icon': true,
        'header-tab-active': isCurrent,
        'header-tab-playing': isActive,
    });

    return (
        <li className={className}  ref={setRef} style={style} {...attributes} {...listeners}>
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
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const model = usePlaylistModel();
    const { playlists, activePlaylistId, currentPlaylistId, allowChange } = usePlaylistsData();
    const currentPlaylistRef = useRef();

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

    return <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={playlists} disabled={!allowChange}>
            <ul className='header-block header-block-primary'>
                {tabs}
            </ul>
        </SortableContext>
    </DndContext>;
}