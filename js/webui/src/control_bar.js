import React from 'react'

import {
    PauseButton,
    PlaybackNavigationButton,
    PlaybackOptionsButton,
    PlayButton,
    PlayNextButton,
    PlayOrPauseButton,
    PlayPreviousButton,
    StopButton,
} from './playback_controls.js';

import PositionControl from './position_control.js'
import { VolumeControl, VolumeControlButton } from './volume_control.js'
import { ViewSwitcher, ViewSwitcherButton } from './view_switcher.js'
import { useSettingValue } from './hooks.js';
import { PlaybackInfoText } from './playback_info_bar.js';

export function ControlBarNarrowCompact()
{
    return <div key='control-bar' className='panel control-bar'>
        <div className='button-bar button-bar-single'>
            <PlaybackOptionsButton />
            <PlaybackNavigationButton showStop={true} />
            <PlayPreviousButton/>
            <PlayOrPauseButton/>
            <PlayNextButton/>
            <VolumeControlButton />
            <ViewSwitcherButton />
        </div>
    </div>;
}

export function ControlBarNarrowFull()
{
    return <div key='control-bar' className='panel control-bar'>
        <PositionControl/>
        <div className='button-bar button-bar-secondary'>
            <PlaybackNavigationButton showStop={true} />
            <PlaybackOptionsButton />
        </div>
        <div className='button-bar button-bar-primary'>
            <PlayPreviousButton/>
            <PlayOrPauseButton/>
            <PlayNextButton/>
        </div>
        <div className='button-bar button-bar-secondary'>
            <VolumeControlButton />
            <ViewSwitcherButton />
        </div>
    </div>
}

export function ControlBarWide()
{
    const combinePlayPause = useSettingValue('combinePlayPause');
    const showPlaybackInfo = useSettingValue('showPlaybackInfo');

    const playPauseButtons = combinePlayPause
        ? <PlayOrPauseButton/>
        : <>
            <PlayButton/>
            <PauseButton/>
        </>;

    const playbackInfo = showPlaybackInfo ? <PlaybackInfoText/> : null;

    return <div key='control-bar' className='panel control-bar'>
        { playbackInfo }
        <div className='button-bar'>
            <StopButton/>
            {playPauseButtons}
            <PlayPreviousButton/>
            <PlayNextButton/>
            <PlaybackOptionsButton/>
            <PlaybackNavigationButton/>
        </div>
        <PositionControl/>
        <VolumeControl/>
        <ViewSwitcher/>
    </div>
}
