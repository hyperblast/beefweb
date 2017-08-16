import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import { PlaybackState } from './client'
import { formatTime } from './utils'

var stateToName = {
    [PlaybackState.playing]: 'Playing',
    [PlaybackState.paused]: 'Paused',
    [PlaybackState.stopped]: 'Stopped'
};

export default class StatusBar extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
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

    componentDidMount()
    {
        this.props.playerModel.on('change', this.handleUpdate);
        this.props.playlistModel.on('playlistsChange', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playerModel.off('change', this.handleUpdate);
        this.props.playlistModel.off('playlistsChange', this.handleUpdate);
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
