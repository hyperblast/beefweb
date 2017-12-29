import React from 'react'
import PropTypes from 'prop-types'
import mapValues from 'lodash/mapValues'
import { PlaybackOrder, LoopMode } from './client'
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

        this.bindEvents({ playerModel: 'change' });

        bindHandlers(this);

        this.playbackOrderHandlers = mapValues(PlaybackOrder, order => {
            return e => {
                e.preventDefault();
                this.props.playerModel.setPlaybackOrder(order);
            };
        });

        this.loopModeHandlers = mapValues(LoopMode, mode => {
            return e => {
                e.preventDefault();
                this.props.playerModel.setLoopMode(mode);
            };
        });
    }

    getStateFromModel()
    {
        const { order, loop } = this.props.playerModel.options;
        return { order, loop };
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

    handleAudioMenuToggle(value)
    {
        this.setState({ audioMenuOpen: value });
    }

    render()
    {
        const { order, loop, audioMenuOpen } = this.state;

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
                        <MenuLabel title='Order' />
                        <MenuItem
                            title='Linear'
                            checked={order === PlaybackOrder.linear}
                            onClick={this.playbackOrderHandlers[PlaybackOrder.linear]} />
                        <MenuItem
                            title='Shuffle albums'
                            checked={order === PlaybackOrder.shuffleAlbums}
                            onClick={this.playbackOrderHandlers[PlaybackOrder.shuffleAlbums]} />
                        <MenuItem
                            title='Shuffle tracks'
                            checked={order === PlaybackOrder.shuffleTracks}
                            onClick={this.playbackOrderHandlers[PlaybackOrder.shuffleTracks]} />
                        <MenuItem
                            title='Random'
                            checked={order === PlaybackOrder.random}
                            onClick={this.playbackOrderHandlers[PlaybackOrder.random]} />
                        <MenuSeparator />
                        <MenuLabel title='Loop' />
                        <MenuItem
                            title='Loop all'
                            checked={loop === LoopMode.all}
                            onClick={this.loopModeHandlers[LoopMode.all]} />
                        <MenuItem
                            title='Loop single track'
                            checked={loop === LoopMode.single}
                            onClick={this.loopModeHandlers[LoopMode.single]} />
                        <MenuItem
                            title={'Don\'t loop'}
                            checked={loop === LoopMode.none}
                            onClick={this.loopModeHandlers[LoopMode.none]} />
                    </Menu>
                </Dropdown>
            </div>
        );
    }
}

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};
