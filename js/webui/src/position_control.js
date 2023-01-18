import React from 'react'
import PropTypes from 'prop-types'
import clamp from 'lodash/clamp'
import PlayerModel from './player_model.js'
import { formatTime } from './utils.js'
import ModelBinding from './model_binding.js';

class PositionControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleClick = this.handleClick.bind(this);
    }

    getStateFromModel()
    {
        const { position, duration } = this.props.playerModel.activeItem;

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
            this.props.playerModel.setPosition(newPosition);
    }

    render()
    {
        var position = this.state.position;
        var duration = this.state.duration;
        var positionPercent = '0%';
        var timeInfo = '';

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

PositionControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};

export default ModelBinding(PositionControl, { playerModel: 'change' });
