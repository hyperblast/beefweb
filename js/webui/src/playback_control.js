import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model.js'
import { Button, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements.js'
import { bindHandlers } from './utils.js'
import urls from './urls.js';
import ModelBinding from './model_binding.js';
import SettingsModel, { MediaSize } from './settings_model.js';
import { DropdownButton } from './dropdown.js';
import { navigationMenuColumns } from './columns.js';
import ServiceContext from "./service_context.js";

class PlaybackControl extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = Object.assign(this.getStateFromModel(), {
            playbackModeOpen: false,
            navigationOpen: false,
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playerModel, settingsModel } = this.context;
        const { playbackMode, playbackModes } = playerModel;
        const { cursorFollowsPlayback } = settingsModel;

        const menuDirection = settingsModel.mediaSizeUp(MediaSize.medium)
            ? 'right'
            : 'center';

        return {
            playbackMode,
            playbackModes,
            cursorFollowsPlayback,
            menuDirection
        };
    }

    handleStop()
    {
        this.context.playerModel.stop();
    }

    handlePlay()
    {
        this.context.playerModel.play();
    }

    handlePlayRandom()
    {
        this.context.playerModel.playRandom();
    }

    handlePause()
    {
        this.context.playerModel.pause();
    }

    handlePrevious()
    {
        this.context.playerModel.previous();
    }

    playPreviousBy(index)
    {
        this.context.playerModel.previousBy(navigationMenuColumns[index].expression);
    }

    handleNext()
    {
        this.context.playerModel.next();
    }

    playNextBy(index)
    {
        this.context.playerModel.nextBy(navigationMenuColumns[index].expression);
    }

    setPlaybackMode(value)
    {
        this.context.playerModel.setPlaybackMode(value);
    }

    handlePlaybackModeRequestOpen(value)
    {
        this.setState({ playbackModeOpen: value });
    }

    handleNavigationRequestOpen(value)
    {
        this.setState({ navigationOpen: value });
    }

    handleCursorFollowsPlaybackClick()
    {
        const { settingsModel } = this.context;
        settingsModel.cursorFollowsPlayback = !settingsModel.cursorFollowsPlayback;
    }

    render()
    {
        const {
            playbackMode,
            playbackModes,
            cursorFollowsPlayback,
            menuDirection,
            playbackModeOpen,
            navigationOpen,
        } = this.state;

        const playbackModeMenuItems = playbackModes.map((mode, index) => (
            <MenuItem
                key={'plmode' + index}
                title={mode}
                checked={index === playbackMode}
                onClick={() => this.setPlaybackMode(index)} />
        ));

        const nextByMenuItems = navigationMenuColumns.map((column, index) => (
            <MenuItem
                key={'nextby' + index}
                title={column.title}
                checked={false}
                onClick={() => this.playNextBy(index)} />
        ));

        const prevByMenuItems = navigationMenuColumns.map((column, index) => (
            <MenuItem
                key={'prevby' + index}
                title={column.title}
                checked={false}
                onClick={() => this.playPreviousBy(index)} />
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
                    title='Playback mode'
                    direction={menuDirection}
                    isOpen={playbackModeOpen}
                    onRequestOpen={this.handlePlaybackModeRequestOpen}>
                    <Menu>
                        <MenuLabel title='Playback mode' />
                        { playbackModeMenuItems }
                    </Menu>
                </DropdownButton>
                <DropdownButton
                    iconName='share'
                    title='Navigation'
                    direction={menuDirection}
                    isOpen={navigationOpen}
                    onRequestOpen={this.handleNavigationRequestOpen}>
                    <Menu>
                        <MenuItem
                            title='Play random'
                            checked={false}
                            onClick={this.handlePlayRandom} />
                        <MenuSeparator />
                        <MenuItem
                            title='Locate current track'
                            checked={false}
                            href={urls.nowPlaying} />
                        <MenuItem
                            title='Cursor follows playback'
                            checked={cursorFollowsPlayback}
                            onClick={this.handleCursorFollowsPlaybackClick} />
                        <MenuSeparator />
                        <MenuLabel title='Play next' />
                        { nextByMenuItems }
                        <MenuSeparator />
                        <MenuLabel title='Play previous'/>
                        { prevByMenuItems }
                    </Menu>
                </DropdownButton>
            </div>
        );
    }
}

PlaybackControl.contextType = ServiceContext;
PlaybackControl.propTypes = {};

export default ModelBinding(PlaybackControl, {
    playerModel: 'change',
    settingsModel: [ 'cursorFollowsPlaybackChange', 'mediaSizeChange' ],
});
