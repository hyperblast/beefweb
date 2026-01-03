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

export class PlayButton extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.handleClick = () => this.context.playerModel.play();
    }

    render()
    {
        return <Button
            name='media-play'
            title='Play'
            onClick={this.handleClick}
            className='control-bar-button'/>
    }
}

export class StopButton extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.handleClick = () => this.context.playerModel.stop();
    }

    render()
    {
        return <Button
            name='media-stop'
            title='Stop'
            onClick={this.handleClick}
            className='control-bar-button'/>;
    }
}

export class PauseButton extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.handleClick = () => this.context.playerModel.pause();
    }

    render()
    {
        return <Button
            name='media-pause'
            title='Pause'
            onClick={this.handleClick}
            className='control-bar-button'/>;
    }
}

class PlayOrPauseButton_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        this.handleClick = () => this.context.playerModel.playOrPause();
    }

    getStateFromModel()
    {
        const { playbackState } = this.context.playerModel;
        return { playbackState };
    }

    render()
    {
        const { playbackState } = this.state;

        return <Button
            name={playbackState === PlaybackState.playing ? 'media-pause' : 'media-play'}
            className='control-bar-button'
            title='Play'
            onClick={this.handleClick}/>;
    }
}

export const PlayOrPauseButton = ModelBinding(PlayOrPauseButton_, {
    playerModel: 'change'
});

export class PlayPreviousButton extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.handleClick = () => this.context.playerModel.previous();
    }

    render()
    {
        return <Button
            name='media-step-backward'
            title='Previous'
            onClick={this.handleClick}
            className='control-bar-button'/>;
    }
}

export class PlayNextButton extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.handleClick = () => this.context.playerModel.next();
    }

    render()
    {
        return <Button
            name='media-step-forward'
            title='Next'
            onClick={this.handleClick}
            className='control-bar-button'/>;
    }
}

class PlaybackOptionsButton_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = Object.assign(this.getStateFromModel(), { isOpen: false });
        this.handleRequestOpen = value => this.setState({ isOpen: value });
    }

    getStateFromModel()
    {
        const { options } = this.context.playerModel;
        return { options };
    }

    render()
    {
        const { menuDirection, menuUp } = this.props;
        const { isOpen, options } = this.state;

        return <DropdownButton
            iconName='audio'
            title='Options'
            buttonClassName='control-bar-button'
            direction={menuDirection}
            up={menuUp}
            isOpen={isOpen}
            onRequestOpen={this.handleRequestOpen}>
            <Menu>
                {this.renderOptions(options)}
            </Menu>
        </DropdownButton>;
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

export const PlaybackOptionsButton = ModelBinding(PlaybackOptionsButton_, {
    playerModel: 'change'
});

class PlaybackNavigationButton_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = Object.assign(this.getStateFromModel(), { isOpen: false });

        this.handleRequestOpen = value => this.setState({ isOpen: value });
        this.playRandom = () => this.context.playerModel.playRandom();
        this.toggleCursorFollowsPlayback = () => {
            const { settingsModel } = this.context;
            settingsModel.cursorFollowsPlayback = !settingsModel.cursorFollowsPlayback;
        };
    }

    playPreviousBy(index)
    {
        this.context.playerModel.previousBy(navigationMenuColumns[index].expression);
    }

    playNextBy(index)
    {
        this.context.playerModel.nextBy(navigationMenuColumns[index].expression);
    }

    getStateFromModel()
    {
        const { cursorFollowsPlayback } = this.context.settingsModel;
        return { cursorFollowsPlayback };
    }

    render()
    {
        const { menuDirection, menuUp } = this.props;
        const { isOpen, cursorFollowsPlayback } = this.state;

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

        return <DropdownButton
            iconName='share'
            title='Navigation'
            buttonClassName='control-bar-button'
            direction={menuDirection}
            up={menuUp}
            isOpen={isOpen}
            onRequestOpen={this.handleRequestOpen}>
            <Menu>
                <MenuItem
                    title='Play random'
                    checked={false}
                    onClick={this.playRandom}/>
                <MenuSeparator/>
                <MenuItem
                    title='Locate current track'
                    checked={false}
                    href={urls.nowPlaying}/>
                <MenuItem
                    title='Cursor follows playback'
                    checked={cursorFollowsPlayback}
                    onClick={this.toggleCursorFollowsPlayback}/>
                <MenuSeparator/>
                <MenuLabel title='Play next'/>
                {nextByMenuItems}
                <MenuSeparator/>
                <MenuLabel title='Play previous'/>
                {prevByMenuItems}
            </Menu>
        </DropdownButton>;
    }
}

export const PlaybackNavigationButton = ModelBinding(PlaybackNavigationButton_, {
    settingsModel: 'cursorFollowsPlaybackChange'
});
