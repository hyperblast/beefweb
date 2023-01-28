import React from 'react'
import PropTypes from 'prop-types'
import PlaybackControl from './playback_control.js'
import PositionControl from './position_control.js'
import VolumeControl from './volume_control.js'
import ViewSwitcher from './view_switcher.js'
import SettingsModel from './settings_model.js';
import NavigationModel from './navigation_model.js';
import PlayerModel from './player_model.js';

export default function ControlBar(props)
{
    const { playerModel, settingsModel, navigationModel } = props;

    return (
        <div key='control-bar' className='panel control-bar'>
            <PlaybackControl playerModel={playerModel} settingsModel={settingsModel} />
            <PositionControl playerModel={playerModel} />
            <VolumeControl />
            <ViewSwitcher navigationModel={navigationModel} />
        </div>
    );
}

ControlBar.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
};
