import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model'
import { Button, DropdownButton, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements'
import { bindHandlers } from './utils'
import urls from './urls';
import ModelBinding from './model_binding';
import SettingsModel from './settings_model';

class PlaybackControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
            audioMenuOpen: false,
            navigationMenuOpen: false,
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackMode, playbackModes } = this.props.playerModel;
        const { cursorFollowsPlayback } = this.props.settingsModel;
        return { playbackMode, playbackModes, cursorFollowsPlayback };
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

    handleAudioMenuRequestOpen(value)
    {
        this.setState({ audioMenuOpen: value });
    }

    handleNavigationMenuRequestOpen(value)
    {
        this.setState({ navigationMenuOpen: value });
    }

    handleCursorFollowsPlaybackClick(e)
    {
        e.preventDefault();
        const { settingsModel } = this.props;
        settingsModel.cursorFollowsPlayback = !settingsModel.cursorFollowsPlayback;
    }

    render()
    {
        const {
            playbackMode,
            playbackModes,
            cursorFollowsPlayback,
            audioMenuOpen,
            navigationMenuOpen
        } = this.state;

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
                <DropdownButton
                    iconName='audio'
                    title='Audio menu'
                    isOpen={audioMenuOpen}
                    onRequestOpen={this.handleAudioMenuRequestOpen}>
                    <Menu>
                        <MenuLabel title='Mode' />
                        { modeMenuItems }
                    </Menu>
                </DropdownButton>
                <DropdownButton
                    iconName='share'
                    title='Navigation menu'
                    isOpen={navigationMenuOpen}
                    onRequestOpen={this.handleNavigationMenuRequestOpen}>
                    <Menu>
                        <MenuItem
                            title='Locate current track'
                            checked={false}
                            href={urls.nowPlaying} />
                        <MenuItem
                            title='Cursor follows playback'
                            checked={cursorFollowsPlayback}
                            onClick={this.handleCursorFollowsPlaybackClick} />
                    </Menu>
                </DropdownButton>
            </div>
        );
    }
}

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
};

export default ModelBinding(PlaybackControl, {
    playerModel: 'change',
    settingsModel: 'cursorFollowsPlaybackChange',
});
