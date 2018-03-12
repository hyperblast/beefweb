import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlayerModel from './player_model'
import { Button, Dropdown } from './elements'
import { bindHandlers } from './utils'

function volumeIcon(isMuted)
{
    return isMuted ? 'volume-off' : 'volume-high';
}

class VolumeControlPanel extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({ playerModel: 'change' });
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        return this.props.playerModel.volume;
    }

    handleMuteClick(e)
    {
        e.preventDefault();

        this.props.playerModel.mute();

        if (this.props.onAfterMuteClick)
            this.props.onAfterMuteClick();
    }

    handleVolumeChange(e)
    {
        e.preventDefault();
        const newVolume = Number(e.target.value);
        this.props.playerModel.setVolume(newVolume);
    }

    render()
    {
        console.log(this.state);

        const { type, min, max, value, isMuted } = this.state;
        const title = value + (type === 'db' ? 'dB' : '');

        return (
            <div className='volume-control-panel'>
                <div className='button-bar'>
                    <Button
                        name={volumeIcon(isMuted)}
                        onClick={this.handleMuteClick}
                        title='Toggle mute' />
                </div>
                <input type='range'
                    className='volume-slider'
                    max={max}
                    min={min}
                    value={value}
                    title={title}
                    onChange={this.handleVolumeChange} />
            </div>
        );
    }
}

VolumeControlPanel.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    onAfterMuteClick: PropTypes.func,
};

export default class VolumeControl extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({ playerModel: 'change' });

        this.state = Object.assign(this.getStateFromModel(), {
           panelOpen: false
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        return {
            isMuted: this.props.playerModel.volume.isMuted
        };
    }

    handlePanelToggle(value)
    {
        this.setState({ panelOpen: value });
    }

    handleMuteClick()
    {
        this.setState({ panelOpen: false });
    }

    render()
    {
        const { playerModel } = this.props;
        const { isMuted, panelOpen } = this.state;

        return (
            <div className='volume-control'>
                <div className='volume-control-mini'>
                    <div className='button-bar'>
                        <Dropdown
                            title='Show volume panel'
                            iconName={volumeIcon(isMuted)}
                            autoHide={false}
                            direction='center'
                            isOpen={panelOpen}
                            onRequestToggle={this.handlePanelToggle}>
                            <VolumeControlPanel
                                playerModel={playerModel}
                                onAfterMuteClick={this.handleMuteClick} />
                        </Dropdown>
                    </div>
                </div>
                <div className='volume-control-full'>
                    <VolumeControlPanel playerModel={playerModel} />
                </div>
            </div>
        );
    }
}

VolumeControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};