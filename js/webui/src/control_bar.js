import React from 'react'
import PropTypes from 'prop-types'
import PlaybackControl from './playback_control'
import PositionControl from './position_control'
import VolumeControl from './volume_control'
import ViewSwitcher from './view_switcher'
import SettingsModel from './settings_model';
import NavigationModel from './navigation_model';
import PlayerModel from './player_model';

export default function ControlBar(props)
{
    const { playerModel, settingsModel, navigationModel } = props;

    return (
        <div key='control-bar' className='panel control-bar'>
            <PlaybackControl playerModel={playerModel} settingsModel={settingsModel} />
            <PositionControl playerModel={playerModel} />
            <VolumeControl playerModel={playerModel} />
            <ViewSwitcher navigationModel={navigationModel} />
        </div>
    );
}

ControlBar.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
};
