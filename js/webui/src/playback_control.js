import React from 'react'
import { Button, Menu, MenuItem, MenuLabel, MenuSeparator } from './elements.js'
import { bindHandlers } from './utils.js'
import urls from './urls.js';
import ModelBinding from './model_binding.js';
import { MediaSize } from './settings_model.js';
import { DropdownButton } from './dropdown.js';
import { navigationMenuColumns } from './columns.js';
import ServiceContext from "./service_context.js";
import { PlaybackState } from 'beefweb-client';

class PlaybackControl extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = Object.assign(this.getStateFromModel(), {
            optionsOpen: false,
            navigationOpen: false,
        });

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playerModel, settingsModel } = this.context;
        const { playbackState, options } = playerModel;
        const { cursorFollowsPlayback, combinePlayPause } = settingsModel;

        const menuDirection = settingsModel.mediaSizeUp(MediaSize.medium)
            ? 'right'
            : 'center';

        return {
            playbackState,
            options,
            cursorFollowsPlayback,
            combinePlayPause,
            menuDirection,
            up: settingsModel.mediaSize === MediaSize.small,
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

    handlePlayOrPause()
    {
        this.context.playerModel.playOrPause();
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

    setOption(id, value)
    {
        this.context.playerModel.setOption(id, value);
    }

    handleOptionsRequestOpen(value)
    {
        this.setState({ optionsOpen: value });
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
            cursorFollowsPlayback,
            combinePlayPause,
            playbackState,
            menuDirection,
            options,
            optionsOpen,
            navigationOpen,
            up,
        } = this.state;

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
                <Button name='media-stop'
                        title='Stop'
                        onClick={this.handleStop}
                        className='control-bar-button' />
                {
                    combinePlayPause
                        ? <Button
                            name={playbackState === PlaybackState.playing ? 'media-pause' : 'media-play'}
                            className='control-bar-button'
                            title='Play'
                            onClick={this.handlePlayOrPause} />
                        : <>
                            <Button name='media-play'
                                    title='Play'
                                    onClick={this.handlePlay}
                                    className='control-bar-button'/>
                            <Button name='media-pause'
                                    title='Pause'
                                    onClick={this.handlePause}
                                    className='control-bar-button'/>
                        </>
                }
                <Button name='media-step-backward'
                        title='Previous'
                        onClick={this.handlePrevious}
                        className='control-bar-button'/>
                <Button name='media-step-forward'
                        title='Next'
                        onClick={this.handleNext}
                        className='control-bar-button'/>
                <DropdownButton
                    iconName='audio'
                    title='Options'
                    buttonClassName='control-bar-button'
                    direction={menuDirection}
                    up={up}
                    isOpen={optionsOpen}
                    onRequestOpen={this.handleOptionsRequestOpen}>
                    <Menu>
                        { this.renderOptions(options) }
                    </Menu>
                </DropdownButton>
                <DropdownButton
                    iconName='share'
                    title='Navigation'
                    buttonClassName='control-bar-button'
                    direction={menuDirection}
                    up={up}
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

    renderOptions(options)
    {
        const menuItems = [];

        const enumOptions = options.filter(o => o.type === 'enum');
        const boolOptions = options.filter(o => o.type === 'bool');

        for (let option of enumOptions)
        {
            const { id, name, value, enumNames } = option;

            menuItems.push(<MenuLabel key={id + 'Name'} title={name} />);

            for (let i = 0; i < enumNames.length; i++)
            {
                menuItems.push(
                    <MenuItem
                        key={id + i}
                        title={enumNames[i]}
                        checked={value === i}
                        onClick={() => this.setOption(id, i)} />);
            }

            menuItems.push(<MenuSeparator key={id + 'Sep'} />)
        }

        for (let option of boolOptions)
        {
            const { id, name, value } = option;

            menuItems.push(
                <MenuItem
                    key={id}
                    title={name}
                    checked={value}
                    onClick={() => this.setOption(id, !value)}/>);
        }

        if (boolOptions.length === 0 && enumOptions.length > 0)
        {
            menuItems.pop();
        }

        return menuItems;
    }
}

export default ModelBinding(PlaybackControl, {
    playerModel: 'change',
    settingsModel: [ 'cursorFollowsPlaybackChange', 'combinePlayPauseChange', 'mediaSizeChange' ],
});
