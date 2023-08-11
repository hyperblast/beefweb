import React from 'react'
import PlaybackControl from './playback_control.js'
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
        return {
            inlineMode: this.context.settingsModel.mediaSizeUp(MediaSize.medium)
        };
    }

    render()
    {
        const { inlineMode } = this.state;

        return (
            <div key='control-bar' className='panel control-bar'>
                <PlaybackControl />
                <PositionControl />
                {
                    inlineMode
                        ? (
                            <>
                                <VolumeControl/>
                                <ViewSwitcher/>
                            </>)
                        : (
                            <div className='button-bar'>
                                <VolumeControlButton/>
                                <ViewSwitcherButton/>
                            </div>
                        )
                }
            </div>
        );
    }
}

export const ControlBar = ModelBinding(ControlBar_, { settingsModel: 'mediaSizeChange' });
