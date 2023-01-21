import React from 'react';
import ModelBinding from './model_binding.js';
import { PlaybackState } from 'beefweb-client';
import ServiceContext from './service_context.js';

class PlaybackInfoBarInner extends React.PureComponent
{
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

PlaybackInfoBarInner.contextType = ServiceContext;

const PlaybackInfoBar = ModelBinding(PlaybackInfoBarInner, {
    playerModel: 'change',
    settingsModel: 'change'
});

export default PlaybackInfoBar;
