import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlayerModel from './player_model'
import { Button, Dropdown, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements'
import { bindHandlers, mapObject } from './utils'
import urls from './urls';

export default class PlaybackControl extends Component
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
            audioMenuOpen: false,
            navigationMenuOpen: false,
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

    handleNavigationMenuToggle(value)
    {
        this.setState({ navigationMenuOpen: value });
    }

    render()
    {
        const { playbackMode, playbackModes, audioMenuOpen, navigationMenuOpen } = this.state;

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
                <Dropdown
                    iconName='share'
                    title='Navigation menu'
                    isOpen={navigationMenuOpen}
                    onRequestToggle={this.handleNavigationMenuToggle}>
                    <Menu>
                        <MenuItem title='Locate current track' href={urls.nowPlaying} />
                    </Menu>
                </Dropdown>
            </div>
        );
    }
}

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};
