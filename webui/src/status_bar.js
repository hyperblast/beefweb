import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import { PlaybackState } from './api_client'
import { formatTime } from './utils'

var stateToName = {
    [PlaybackState.playing]: 'Playing',
    [PlaybackState.paused]: 'Paused',
    [PlaybackState.stopped]: 'Stopped'
};

export default class StatusBar extends Component
{
    constructor(props)
    {
        super(props);

        this.bindEvents({
            playerModel: 'change',
            playlistModel: 'playlistsChange',
        });

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        var playerModel = this.props.playerModel;
        var playlistModel = this.props.playlistModel;
        var currentPlaylist = playlistModel.currentPlaylist;

        return {
            playbackState: playerModel.playbackState,
            itemCount: currentPlaylist ? currentPlaylist.itemCount : 0,
            totalTime: currentPlaylist ? currentPlaylist.totalTime : 0
        };
    }

    getStatusLine()
    {
        var items = [
            stateToName[this.state.playbackState],
            `${this.state.itemCount} track(s)`,
            `${formatTime(this.state.totalTime, true)} total playtime`
        ];

        return items.join(' | ');
    }

    render()
    {
        return <div className='panel status-bar'>{this.getStatusLine()}</div>;
    }
}

StatusBar.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};
