import React from 'react'
import PropTypes from 'prop-types'
import { PlaybackState } from 'beefweb-client'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import { formatTime } from './utils'
import ModelBinding from './model_binding';

const stateToName = Object.freeze({
    [PlaybackState.playing]: 'Playing',
    [PlaybackState.paused]: 'Paused',
    [PlaybackState.stopped]: 'Stopped'
});

class StatusBar extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { playerModel, playlistModel } = this.props;

        const totalTime = playlistModel.currentPlaylist
            ? playlistModel.currentPlaylist.totalTime
            : 0;

        return {
            playbackState: playerModel.playbackState,
            totalCount: playlistModel.playlistItems.totalCount,
            totalTime
        };
    }

    getStatusLine()
    {
        const { playbackState, totalCount, totalTime } = this.state;

        var items = [
            stateToName[playbackState],
            `${totalCount} track(s)`,
            `${formatTime(totalTime, true)} total playtime`
        ];

        return items.join(' | ');
    }

    render()
    {
        return <div className='panel status-bar'>{ this.getStatusLine() }</div>;
    }
}

StatusBar.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};

export default ModelBinding(StatusBar, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange']
});
