import React from 'react'
import { PlaybackState } from 'beefweb-client'
import { formatTime } from './utils'
import ModelBinding from './model_binding';
import ServiceContext from './service_context';

const stateToName = Object.freeze({
    [PlaybackState.playing]: 'Playing',
    [PlaybackState.paused]: 'Paused',
    [PlaybackState.stopped]: 'Stopped'
});

class StatusBar extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { playerModel, playlistModel } = this.context;

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

        const items = [
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

StatusBar.contextType = ServiceContext;

export default ModelBinding(StatusBar, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange']
});
