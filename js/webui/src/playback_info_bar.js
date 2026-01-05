import React from 'react';
import ModelBinding from './model_binding.js';
import { PlaybackState } from 'beefweb-client';
import ServiceContext from './service_context.js';

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

        const title = playerModel.playbackState !== PlaybackState.stopped
            ? (playerModel.activeItem.columns[1] || '')
            : playerModel.info.title;

        return { title };
    }

    render()
    {
        const { title } = this.state;

        return <div className='panel playback-info-bar' title={title}>{title}</div>;
    }
}

const PlaybackInfoBar = ModelBinding(PlaybackInfoBar_, {
    playerModel: 'change'
});

export default PlaybackInfoBar;
