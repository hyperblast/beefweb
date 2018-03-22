import React from 'react'
import PropTypes from 'prop-types'
import mapValues from 'lodash/mapValues'
import Component from './component'
import PlayerModel from './player_model'
import { Button, Dropdown, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements'
import { bindHandlers, mapObject } from './utils'

export default class PlaybackControl extends Component
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
            audioMenuOpen: false
        });

        this.updateOn({ playerModel: 'change' });
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackMode, playbackModes } = this.props.playerModel;
        return { playbackMode, playbackModes };
    }

    handleStop(e)
    {
        e.preventDefault();
        this.props.playerModel.stop();
    }

    handlePlay(e)
    {
        e.preventDefault();
        this.props.playerModel.play();
    }

    handlePause(e)
    {
        e.preventDefault();
        this.props.playerModel.pause();
    }

    handlePrevious(e)
    {
        e.preventDefault();
        this.props.playerModel.previous();
    }

    handleNext(e)
    {
        e.preventDefault();
        this.props.playerModel.next();
    }

    handleSetMode(e, value)
    {
        e.preventDefault();
        this.props.playerModel.setPlaybackMode(value);
    }

    handleAudioMenuToggle(value)
    {
        this.setState({ audioMenuOpen: value });
    }

    render()
    {
        const { playbackMode, playbackModes, audioMenuOpen } = this.state;

        const modeMenuItems = playbackModes.map((mode, index) => (
            <MenuItem
                key={index}
                title={mode}
                checked={index === playbackMode}
                onClick={e => this.handleSetMode(e, index)} />
        ));

        return (
            <div className='playback-control button-bar'>
                <Button
                    name='media-stop'
                    title='Stop'
                    onClick={this.handleStop} />
                <Button
                    name='media-play'
                    title='Play'
                    onClick={this.handlePlay} />
                <Button
                    name='media-pause'
                    title='Pause'
                    onClick={this.handlePause} />
                <Button
                    name='media-step-backward'
                    title='Previous'
                    onClick={this.handlePrevious} />
                <Button
                    name='media-step-forward'
                    title='Next'
                    onClick={this.handleNext} />
                <Dropdown
                    iconName='audio'
                    title='Audio menu'
                    isOpen={audioMenuOpen}
                    onRequestToggle={this.handleAudioMenuToggle}>
                    <Menu>
                        <MenuLabel title='Mode' />
                        { modeMenuItems }
                    </Menu>
                </Dropdown>
            </div>
        );
    }
}

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};
