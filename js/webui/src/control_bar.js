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
import ServiceContext from "./service_context.js";
import ModelBinding from "./model_binding.js";
import { MediaSize } from "./settings_model.js";
import { View } from './navigation_model.js';

class ControlBar_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { view } = this.context.navigationModel;
        const { mediaSize, combinePlayPause } = this.context.settingsModel;
        return { view, mediaSize, combinePlayPause };
    }

    renderNarrowCompact()
    {
        return <div key='control-bar' className='panel control-bar'>
            <div className='button-bar button-bar-single'>
                <PlaybackOptionsButton menuUp={true} menuDirection='right'/>
                <PlaybackNavigationButton menuUp={true} menuDirection='right'/>
                <PlayPreviousButton/>
                <PlayOrPauseButton/>
                <PlayNextButton/>
                <VolumeControlButton menuUp={true} menuDirection='left'/>
                <ViewSwitcherButton menuUp={true} menuDirection='left'/>
            </div>
        </div>;
    }

    renderNarrowFull()
    {
        return <div key='control-bar' className='panel control-bar'>
            <PositionControl/>
            <div className='button-bar button-bar-secondary'>
                <PlaybackNavigationButton menuUp={true} menuDirection='right'/>
                <PlaybackOptionsButton menuUp={true} menuDirection='right'/>
            </div>
            <div className='button-bar button-bar-primary'>
                <PlayPreviousButton/>
                <PlayOrPauseButton/>
                <PlayNextButton/>
            </div>
            <div className='button-bar button-bar-secondary'>
                <VolumeControlButton menuUp={true} menuDirection='left'/>
                <ViewSwitcherButton menuUp={true} menuDirection='left'/>
            </div>
        </div>;
    }

    renderWide()
    {
        const playPauseButtons =
            this.state.combinePlayPause
            ? <PlayOrPauseButton/>
            : <>
                <PlayButton/>
                <PauseButton/>
            </>

        return <div key='control-bar' className='panel control-bar'>
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
        </div>;
    }

    render()
    {
        const { view, mediaSize } = this.state;

        return mediaSize === MediaSize.small
               ? view === View.playlist || view === View.albumArt
                    ? this.renderNarrowFull()
                    : this.renderNarrowCompact()
               : this.renderWide();
    }
}

export const ControlBar = ModelBinding(ControlBar_, {
    navigationModel: 'viewChange',
    settingsModel: ['mediaSize', 'combinePlayPause']
});
