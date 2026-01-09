import React from 'react';
import { PlaybackState } from 'beefweb-client';
import { AutoScrollText } from './elements.js';
import { defineModelData } from './hooks.js';

const usePlaybackInfo = defineModelData({
    selector(context) {
        const { playerModel } = context;

        return playerModel.playbackState !== PlaybackState.stopped
                     ? (playerModel.activeItem.columns[1] || '')
                     : playerModel.info.title;
    },

    updateOn: {
        playerModel: 'change'
    }
});

export function PlaybackInfoText()
{
    const text = usePlaybackInfo();
    return <AutoScrollText className='playback-info-text' text={text}/>;
}

export function PlaybackInfoBar()
{
    return <div className='panel playback-info-bar'><PlaybackInfoText/></div>
}
