import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel, { navigationColumns } from './player_model'
import { Button, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements'
import { bindHandlers } from './utils'
import urls from './urls';
import ModelBinding from './model_binding';
import SettingsModel, { MediaSize } from './settings_model';
import { DropdownButton } from './dropdown';

class PlaybackControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(this.getStateFromModel(), {
            playbackModeOpen: false,
            navigationOpen: false,
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playerModel, settingsModel } = this.props;
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

    handlePlayRandom(e)
    {
        e.preventDefault();
        this.props.playerModel.playRandom();
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

    handlePreviousBy(e, index)
    {
        e.preventDefault();
        this.props.playerModel.previousBy(navigationColumns[index].expression);
    }

    handleNext(e)
    {
        e.preventDefault();
        this.props.playerModel.next();
    }

    handleNextBy(e, index)
    {
        e.preventDefault();
        this.props.playerModel.nextBy(navigationColumns[index].expression);
    }

    handleSetPlaybackMode(e, value)
    {
        e.preventDefault();
        this.props.playerModel.setPlaybackMode(value);
    }

    handlePlaybackModeRequestOpen(value)
    {
        this.setState({ playbackModeOpen: value });
    }

    handleNavigationRequestOpen(value)
    {
        this.setState({ navigationOpen: value });
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
            menuDirection,
            playbackModeOpen,
            navigationOpen,
        } = this.state;

        const playbackModeMenuItems = playbackModes.map((mode, index) => (
            <MenuItem
                key={'plmode' + index}
                title={mode}
                checked={index === playbackMode}
                onClick={e => this.handleSetPlaybackMode(e, index)} />
        ));

        const nextByMenuItems = navigationColumns.map((column, index) => (
            <MenuItem
                key={'nextby' + index}
                title={column.title}
                checked={false}
                onClick={e => this.handleNextBy(e, index)} />
        ));

        const prevByMenuItems = navigationColumns.map((column, index) => (
            <MenuItem
                key={'prevby' + index}
                title={column.title}
                checked={false}
                onClick={e => this.handlePreviousBy(e, index)} />
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

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
};

export default ModelBinding(PlaybackControl, {
    playerModel: 'change',
    settingsModel: [ 'cursorFollowsPlaybackChange', 'mediaSizeChange' ],
});
