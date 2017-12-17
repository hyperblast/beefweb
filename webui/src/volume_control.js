import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model'
import { IconLink } from './elements'

export default class VolumeControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleMuteClick = this.handleMuteClick.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
    }

    getStateFromModel()
    {
        var playerModel = this.props.playerModel;
        var volume = playerModel.volume;

        return {
            isMuted: volume.isMuted,
            volumeMax: 0.0,
            volumeMin: volume.dbMin,
            volume: volume.db,
        };
    }

    componentDidMount()
    {
        this.props.playerModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playerModel.off('change', this.handleUpdate);
    }

    handleMuteClick(e)
    {
        e.preventDefault();
        this.props.playerModel.mute();
    }

    handleVolumeChange(e)
    {
        e.preventDefault();
        var newVolume = Number(e.target.value);
        this.setState({ volume: newVolume });
        this.props.playerModel.setVolume(newVolume);
    }

    render()
    {
        var volumeIcon = this.state.isMuted ? 'volume-off' : 'volume-high';

        return (
            <div className='volume-control'>
                <div className='button-bar'>
                    <IconLink name={volumeIcon} onClick={this.handleMuteClick} title='Toggle mute' />
                </div>
                <input type='range'
                    max={this.state.volumeMax}
                    min={this.state.volumeMin}
                    value={this.state.volume}
                    title={this.state.volume + 'dB'}
                    onChange={this.handleVolumeChange} />
            </div>
        );
    }
}

VolumeControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};
