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
        const { mediaSize, combinePlayPause } = this.context.settingsModel;
        return { mediaSize, combinePlayPause };
    }

    renderSmall()
    {
        return <div key='control-bar' className='panel control-bar'>
            <div className='button-bar'>
                <StopButton/>
                <PlayPreviousButton/>
                <PlayOrPauseButton/>
                <PlayNextButton/>
                <PlaybackOptionsButton menuUp={true}/>
                <PlaybackNavigationButton menuUp={true}/>
                <VolumeControlButton menuUp={true}/>
                <ViewSwitcherButton menuUp={true}/>
            </div>
            <PositionControl/>
        </div>;
    }

    renderMediumUp()
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
        return this.state.mediaSize === MediaSize.small
               ? this.renderSmall()
               : this.renderMediumUp();
    }
}

export const ControlBar = ModelBinding(ControlBar_, {
    settingsModel: ['mediaSizeChange', 'combinePlayPause']
});
