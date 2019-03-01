import React from 'react';
import ModelBinding from './model_binding';
import { PlaybackState } from 'beefweb-client';
import ServiceContext from './service_context';

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
            ? (playerModel.activeItem.columns[0] || '')
            : '';

        return { title };
    }

    render()
    {
        const { title } = this.state;

        return title ? <div className='panel playback-info-bar'>{title}</div> : null;
    }
}

PlaybackInfoBarInner.contextType = ServiceContext;

const PlaybackInfoBar = ModelBinding(PlaybackInfoBarInner, {
    playerModel: 'change',
    settingsModel: 'change'
});

export default PlaybackInfoBar;
