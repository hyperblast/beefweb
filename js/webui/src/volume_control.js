import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model.js'
import { Button} from './elements.js'
import { bindHandlers } from './utils.js'
import ModelBinding from './model_binding.js';
import { DropdownButton } from './dropdown.js';
import ServiceContext from "./service_context.js";

function volumeIcon(isMuted)
{
    return isMuted ? 'volume-off' : 'volume-high';
}

class VolumeControlPanelInner extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        return this.context.playerModel.volume;
    }

    handleMuteClick()
    {
        this.context.playerModel.mute();

        if (this.props.onAfterMuteClick)
            this.props.onAfterMuteClick();
    }

    handleVolumeChange(e)
    {
        e.preventDefault();
        const newVolume = Number(e.target.value);
        this.context.playerModel.setVolume(newVolume);
    }

    render()
    {
        const { type, min, max, value, isMuted } = this.state;
        const title = value.toFixed(0) + (type === 'db' ? 'dB' : '');

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

VolumeControlPanelInner.propTypes = {
    onAfterMuteClick: PropTypes.func,
};

VolumeControlPanelInner.contextType = ServiceContext;

const VolumeControlPanel = ModelBinding(VolumeControlPanelInner, { playerModel: 'change' });

class VolumeControl extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = Object.assign(this.getStateFromModel(), {
           panelOpen: false
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        return {
            isMuted: this.context.playerModel.volume.isMuted
        };
    }

    handlePanelRequestOpen(value)
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
                        <DropdownButton
                            title='Show volume panel'
                            iconName={volumeIcon(isMuted)}
                            hideOnContentClick={false}
                            direction='center'
                            isOpen={panelOpen}
                            onRequestOpen={this.handlePanelRequestOpen}>
                            <VolumeControlPanel
                                playerModel={playerModel}
                                onAfterMuteClick={this.handleMuteClick} />
                        </DropdownButton>
                    </div>
                </div>
                <div className='volume-control-full'>
                    <VolumeControlPanel playerModel={playerModel} />
                </div>
            </div>
        );
    }
}

VolumeControl.propTypes = {};
VolumeControl.contextType = ServiceContext;

export default ModelBinding(VolumeControl, { playerModel: 'change' });
