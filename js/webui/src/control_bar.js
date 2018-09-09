import React from 'react'
import PropTypes from 'prop-types'
import AppModel from './app_model'
import PlaybackControl from './playback_control'
import PositionControl from './position_control'
import VolumeControl from './volume_control'
import ViewSwitcher from './view_switcher'

export default function ControlBar(props)
{
    const { appModel } = props;
    const { playerModel, settingsModel } = appModel;

    return (
        <div key='control-bar' className='panel control-bar'>
            <PlaybackControl playerModel={playerModel} settingsModel={settingsModel} />
            <PositionControl playerModel={playerModel} />
            <VolumeControl playerModel={playerModel} />
            <ViewSwitcher appModel={appModel} />
        </div>
    );
}

ControlBar.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired
};
