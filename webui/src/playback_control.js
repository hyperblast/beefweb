import React from 'react'
import PropTypes from 'prop-types'
import PlayerModel from './player_model'
import { IconLink } from './elements'

export default class PlaybackControl extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.handleStop = this.handleStop.bind(this);
        this.handlePlay = this.handlePlay.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handlePrevious = this.handlePrevious.bind(this);
        this.handleNext = this.handleNext.bind(this);
    }

    handleStop(e)
    {
        e.preventDefault();
        this.props.playerModel.stop();
    }

    handlePlay(e)
    {
        e.preventDefault();
        this.props.playerModel.play();
    }

    handlePause(e)
    {
        e.preventDefault();
        this.props.playerModel.pause();
    }

    handlePrevious(e)
    {
        e.preventDefault();
        this.props.playerModel.previous();
    }

    handleNext(e)
    {
        e.preventDefault();
        this.props.playerModel.next();
    }

    render()
    {
        return (
            <div className='playback-control button-bar'>
                <IconLink name='media-stop' href='#' title='Stop' onClick={this.handleStop} />
                <IconLink name='media-play' href='#' title='Play' onClick={this.handlePlay} />
                <IconLink name='media-pause' href='#' title='Pause' onClick={this.handlePause} />
                <IconLink name='media-step-backward' href='#' title='Previous' onClick={this.handlePrevious} />
                <IconLink name='media-step-forward' href='#' title='Next' onClick={this.handleNext} />
            </div>
        );
    }
}

PlaybackControl.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired
};
