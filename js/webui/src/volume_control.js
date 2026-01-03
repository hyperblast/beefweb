import React from 'react'
import PropTypes from 'prop-types'
import { Button } from './elements.js'
import { bindHandlers, dbToLinear, linearToDb } from './utils.js'
import ModelBinding from './model_binding.js';
import { DropdownButton } from './dropdown.js';
import ServiceContext from "./service_context.js";
import { MediaSize } from './settings_model.js';

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
            return {type, min, max, value, valueText: value.toFixed(0), isMuted};
        }

        return {
            type,
            min: 0.0,
            max: 100.0,
            value: dbToLinear(value) * 100.0,
            valueText: Math.max(value, min).toFixed(0) + ' dB',
            isMuted,
        };
    }

    handleMuteClick()
    {
        this.context.playerModel.mute();

        if (this.props.onAfterMuteClick)
            this.props.onAfterMuteClick();
    }

    handleVolumeUp()
    {
        this.context.playerModel.volumeUp();
    }

    handleVolumeDown(e)
    {
        this.context.playerModel.volumeDown();
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

    render() {
        const {valueText, min, max, value, isMuted, type} = this.state;
        const isUpDown = type === 'upDown';

        return (
            <div className='volume-control button-bar'>
                <Button
                    name={volumeIcon(isMuted)}
                    onClick={this.handleMuteClick}
                    title='Toggle mute'/>
                {
                    isUpDown
                        ? <>
                            <Button name='minus' title='Decrease volume' onClick={this.handleVolumeDown}/>
                            <Button name='plus' title='Increase volume' onClick={this.handleVolumeUp}/>
                            <div className='volume-text-block'><span className='volume-text'>{valueText}</span></div>
                        </>
                        : <input type='range'
                                 className='volume-slider'
                                 max={max}
                                 min={min}
                                 value={value}
                                 title={valueText}
                                 onChange={this.handleVolumeChange}/>
                }
            </div>
        );
    }
}

VolumeControl_.propTypes = {
    onAfterMuteClick: PropTypes.func,
};

export const VolumeControl = ModelBinding(VolumeControl_, {playerModel: 'change'});

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
        const { isMuted } = this.context.playerModel.volume;
        return { isMuted };
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
        const { menuUp } = this.props;
        const { isMuted, panelOpen } = this.state;

        return (
            <DropdownButton
                title='Show volume control'
                iconName={volumeIcon(isMuted)}
                buttonClassName='control-bar-button'
                hideOnContentClick={false}
                direction='left'
                up={menuUp}
                isOpen={panelOpen}
                onRequestOpen={this.handlePanelRequestOpen}>
                <VolumeControl onAfterMuteClick={this.handleMuteClick} />
            </DropdownButton>
        );
    }
}

export const VolumeControlButton = ModelBinding(VolumeControlButton_, {
    playerModel: 'change'
});
