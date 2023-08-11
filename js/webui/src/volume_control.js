import React from 'react'
import PropTypes from 'prop-types'
import { Button } from './elements.js'
import { bindHandlers, dbToLinear, linearToDb } from './utils.js'
import ModelBinding from './model_binding.js';
import { DropdownButton } from './dropdown.js';
import ServiceContext from "./service_context.js";

function volumeIcon(isMuted)
{
    return isMuted ? 'volume-off' : 'volume-high';
}

class VolumeControl_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const {type, min, max, value, isMuted} = this.context.playerModel.volume;

        if (type !== 'db')
        {
            return {type, min, max, value, hintText: value.toFixed(0), isMuted};
        }

        return {
            type: 'db',
            min: 0.0,
            max: 100.0,
            value: dbToLinear(value) * 100.0,
            hintText: Math.max(value, min).toFixed(0) + ' dB',
            isMuted,
        };
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

        const value = Number(e.target.value);
        const volume = this.state.type === 'db'
            ? Math.max(linearToDb(value / 100.0), this.context.playerModel.volume.min)
            : value;

        this.context.playerModel.setVolume(volume);
    }

    render()
    {
        const { hintText, min, max, value, isMuted } = this.state;

        return (
            <div className='volume-control'>
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
                    title={hintText}
                    onChange={this.handleVolumeChange} />
            </div>
        );
    }
}

VolumeControl_.propTypes = {
    onAfterMuteClick: PropTypes.func,
};

export const VolumeControl = ModelBinding(VolumeControl_, { playerModel: 'change' });

class VolumeControlButton_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);

        this.state = this.getStateFromModel();
        this.state.panelOpen = false;
    }

    getStateFromModel()
    {
        return {
            isMuted: this.context.playerModel.volume.isMuted,
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
        const { isMuted, panelOpen } = this.state;

        return (
            <DropdownButton
                title='Show volume control'
                iconName={volumeIcon(isMuted)}
                hideOnContentClick={false}
                direction='left'
                isOpen={panelOpen}
                onRequestOpen={this.handlePanelRequestOpen}>
                <VolumeControl onAfterMuteClick={this.handleMuteClick} />
            </DropdownButton>
        );
    }
}

export const VolumeControlButton = ModelBinding(VolumeControlButton_, { playerModel: 'change' });
