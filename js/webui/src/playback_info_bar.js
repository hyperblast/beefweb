import React from 'react';
import ModelBinding from './model_binding.js';
import { PlaybackState } from 'beefweb-client';
import ServiceContext from './service_context.js';
import { AutoScrollText } from './elements.js';

class PlaybackInfoBar_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { playerModel } = this.context;

        const text = playerModel.playbackState !== PlaybackState.stopped
                      ? (playerModel.activeItem.columns[1] || '')
                      : playerModel.info.title;

        return { text };
    }

    render()
    {
        const { text } = this.state;

        return <div className='panel playback-info-bar' title={text}>
            <AutoScrollText text={text} />
        </div>;
    }
}

const PlaybackInfoBar = ModelBinding(PlaybackInfoBar_, {
    playerModel: 'change'
});

export default PlaybackInfoBar;
