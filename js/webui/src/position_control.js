import React from 'react'
import { clamp } from 'lodash'
import { formatTime } from './utils.js'
import ModelBinding from './model_binding.js';
import ServiceContext from "./service_context.js";

class PositionControl extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.handleClick = this.handleClick.bind(this);
    }

    getStateFromModel()
    {
        const { position, duration } = this.context.playerModel.activeItem;
        return { duration, position };
    }

    handleClick(e)
    {
        if (e.button !== 0)
            return;

        const rect = e.target.getBoundingClientRect();
        const positionPercent = (e.clientX - rect.left) / rect.width;
        const newPosition = this.state.duration * positionPercent;

        if (newPosition >= 0)
            this.context.playerModel.setPosition(newPosition);
    }

    render()
    {
        const { position, duration } = this.state;

        let positionPercent = '0%';
        let timeInfo = '';

        if (position >= 0 && duration > 0)
        {
            positionPercent = '' + clamp(100 * position / duration, 0, 100) + '%';
            timeInfo = formatTime(position) + ' / ' + formatTime(duration);
        }

        return (
            <div className='position-control'>
                <div className='progress-bar' onClick={this.handleClick}>
                    <div className='progress-bar-gauge' style={{width: positionPercent}}></div>
                    <div className='progress-bar-text'>{timeInfo}</div>
                </div>
            </div>
        );
    }
}

export default ModelBinding(PositionControl, {
    playerModel: ['change', 'playbackPosition']
});
