import React from 'react';
import { PlaybackState } from 'beefweb-client';
import { AutoScrollText } from './elements.js';
import { defineModelData } from './hooks.js';

const usePlaybackInfoData = defineModelData({
    selector(context) {
        const { playerModel } = context;

        const text = playerModel.playbackState !== PlaybackState.stopped
                     ? (playerModel.activeItem.columns[1] || '')
                     : playerModel.info.title;

        return { text };
    },

    updateOn: {
        playerModel: 'change'
    }
});

export function PlaybackInfoText()
{
    const { text } = usePlaybackInfoData();
    return <AutoScrollText className='playback-info-text' text={text}/>;
}

export function PlaybackInfoBar()
{
    return <div className='panel playback-info-bar'><PlaybackInfoText/></div>
}
