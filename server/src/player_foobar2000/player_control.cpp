#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

PlaybackState PlayerImpl::getPlaybackState()
{
    if (playbackControl_->is_paused())
       return PlaybackState::PAUSED;
    
    if (playbackControl_->is_playing())
        return PlaybackState::PLAYING;

    return PlaybackState::STOPPED;
}

void PlayerImpl::queryVolume(VolumeInfo* volume)
{
    volume->db = playbackControl_->get_volume();
    volume->dbMin = playback_control::volume_mute;
    volume->isMuted = playbackControl_->is_muted();
}

PlayerStatePtr PlayerImpl::queryPlayerState(TrackQuery* activeItemQuery)
{
    auto state = std::make_unique<PlayerState>();
    state->playbackState = getPlaybackState();
    queryVolume(&state->volume);
    return state;
}

void PlayerImpl::playCurrent()
{
    playbackControl_->play_or_unpause();
}

void PlayerImpl::playItem(const PlaylistRef& playlist, int32_t itemIndex)
{
}

void PlayerImpl::playRandom()
{
    playbackControl_->start(playback_control::track_command_rand);
}

void PlayerImpl::playNext()
{
    playbackControl_->next();
}

void PlayerImpl::playPrevious()
{
    playbackControl_->previous();
}

void PlayerImpl::stop()
{
    playbackControl_->stop();
}

void PlayerImpl::pause()
{
    playbackControl_->pause(true);
}

void PlayerImpl::togglePause()
{
    playbackControl_->toggle_pause();
}

void PlayerImpl::setMuted(Switch val)
{
    switch (val)
    {
    case Switch::FALSE:
        if (playbackControl_->is_muted())
            playbackControl_->volume_mute_toggle();
        break;

    case Switch::TRUE:
        if (!playbackControl_->is_muted())
            playbackControl_->volume_mute_toggle();
        break;

    case Switch::TOGGLE:
        playbackControl_->volume_mute_toggle();
        break;
    }
}

void PlayerImpl::seekAbsolute(double offsetSeconds)
{
}

void PlayerImpl::seekRelative(double offsetSeconds)
{
}

void PlayerImpl::setVolumeDb(double val)
{
}

void PlayerImpl::setVolumeAmp(double val)
{
}

TrackQueryPtr PlayerImpl::createTrackQuery(const std::vector<std::string>& columns)
{
    return TrackQueryPtr();
}

}}
