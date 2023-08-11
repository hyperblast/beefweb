import React from 'react'
import { PlaybackState } from 'beefweb-client'
import { formatTime } from './utils.js'
import ModelBinding from './model_binding.js';
import ServiceContext from './service_context.js';
import urls from './urls.js';

const stateToName = Object.freeze({
    [PlaybackState.playing]: 'Playing',
    [PlaybackState.paused]: 'Paused',
    [PlaybackState.stopped]: 'Stopped'
});

class StatusBar extends React.PureComponent
{
    static contextType = ServiceContext;

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
            totalTime,
            showTotalTime: playerModel.features.showTotalTime,
        };
    }

    getStatusLine()
    {
        const { playbackState, totalCount, totalTime, showTotalTime } = this.state;

        const items = [
            stateToName[playbackState],
            `${totalCount} track(s)`,
        ];

        if (showTotalTime)
            items.push(`${formatTime(totalTime, true)} total playtime`);

        return items.join(' | ');
    }

    render()
    {
        return (
            <div className='panel status-bar'>
                <a className='status-bar-link' href={urls.nowPlaying}>
                    { this.getStatusLine() }
                </a>
            </div>
        );
    }
}

export default ModelBinding(StatusBar, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange']
});
