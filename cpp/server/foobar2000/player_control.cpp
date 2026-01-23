#include "player.hpp"
#include "project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

namespace {

double clampVolume(double value)
{
    return std::max(std::min(value, 0.0), static_cast<double>(playback_control::volume_mute));
}

}

std::vector<std::string> PlayerImpl::evaluatePlaybackColumns(const TitleFormatVector& compiledColumns)
{
    std::vector<std::string> result;
    result.reserve(compiledColumns.size());

    pfc::string8 buffer;

    for (auto& compiledColumn : compiledColumns)
    {
        auto ret = playbackControl_->playback_format_title(
            nullptr,
            buffer,
            compiledColumn,
            nullptr,
            playback_control::display_level_all);

        if (!ret)
        {
            result.clear();
            return result;
        }

        result.emplace_back(buffer.get_ptr(), buffer.get_length());
    }

    return result;
}

PlaybackState PlayerImpl::getPlaybackState()
{
    if (playbackControl_->is_paused())
        return PlaybackState::PAUSED;

    if (playbackControl_->is_playing())
        return PlaybackState::PLAYING;

    return PlaybackState::STOPPED;
}

void PlayerImpl::queryInfo(PlayerInfo* info)
{
    auto versionInfo = core_version_info_v2::get();

    info->name = MSRV_PLAYER_FOOBAR2000;
    info->title = versionInfo->get_name();
    info->version = versionInfo->get_version_as_text();
    info->pluginVersion = MSRV_VERSION_STRING;
}

void PlayerImpl::queryVolume(VolumeInfo* volume)
{
    if (playbackControl_->custom_volume_is_active())
    {
        volume->type = VolumeType::UP_DOWN;
        volume->min = playbackControl_->custom_volume_min();
        volume->max = playbackControl_->custom_volume_max();
        volume->value = playbackControl_->custom_volume_get();
    }
    else
    {
        volume->type = VolumeType::DB;
        volume->min = playback_control::volume_mute;
        volume->max = 0.0;
        volume->value = playbackControl_->get_volume();
    }

    volume->isMuted = playbackControl_->is_muted();
}

void PlayerImpl::queryActiveItem(ActiveItemInfo* info, ColumnsQuery* query)
{
    t_size activePlaylist;
    t_size activeItem;

    info->position = playbackControl_->playback_get_position();
    info->duration = playbackControl_->playback_get_length_ex();

    if (auto queryImpl = dynamic_cast<ColumnsQueryImpl*>(query))
    {
        info->columns = evaluatePlaybackColumns(queryImpl->columns);
    }

    if (playlistManager_->get_playing_item_location(&activePlaylist, &activeItem))
    {
        info->playlistId = playlists_->getId(static_cast<int32_t>(activePlaylist));
        info->playlistIndex = static_cast<int32_t>(activePlaylist);
        info->index = static_cast<int32_t>(activeItem);
    }
    else
    {
        info->playlistIndex = -1;
        info->index = -1;
    }
}

PlayerStatePtr PlayerImpl::queryPlayerState(ColumnsQuery* activeItemQuery)
{
    auto state = std::make_unique<PlayerState>();

    state->playbackState = getPlaybackState();
    queryInfo(&state->info);
    queryVolume(&state->volume);
    queryActiveItem(&state->activeItem, activeItemQuery);
    state->playbackModeOption = playbackModeOption();
    state->options = &options();

    return state;
}

void PlayerImpl::playCurrent()
{
    playbackControl_->play_or_unpause();
}

void PlayerImpl::playItem(const PlaylistRef& plref, int32_t itemIndex)
{
    auto playlist = playlists_->getIndex(plref);

    if (!isValidItemIndex(playlist, itemIndex))
        return;

    playlistManager_->set_active_playlist(playlist);
    playlistManager_->playlist_execute_default_action(playlist, itemIndex);
}

void PlayerImpl::playRandom()
{
    playbackControl_->start(playback_control::track_command_rand);
}

void PlayerImpl::playNext()
{
    playbackControl_->next();
}

bool PlayerImpl::playNextBy(const std::string& expression)
{
    return playNextBy(expression, 1);
}

void PlayerImpl::playPrevious()
{
    playbackControl_->previous();
}

bool PlayerImpl::playPreviousBy(const std::string& expression)
{
    return playNextBy(expression, -1);
}

bool PlayerImpl::playNextBy(const std::string& expression, int increment)
{
    service_ptr_t<titleformat_object> format;

    if (!titleFormatCompiler_->compile(format, expression.c_str()))
        throw InvalidRequestException("invalid format expression: " + expression);

    t_size playlist;
    t_size activeItem;
    if (!playlistManager_->get_playing_item_location(&playlist, &activeItem))
        return false;

    pfc::string8 activeValue;
    pfc::string8 currentValue;

    const auto ret = playbackControl_->playback_format_title(
        nullptr,
        activeValue,
        format,
        nullptr,
        playback_control::display_level_titles);

    if (!ret)
        return false;

    const auto count = playlistManager_->playlist_get_item_count(playlist);

    for (
        t_size item = activeItem + increment;
        item < count;
        item += increment)
    {
        playlistManager_->playlist_item_format_title(
            playlist,
            item,
            nullptr,
            currentValue,
            format,
            nullptr,
            playback_control::display_level_titles);

        if (activeValue == currentValue)
            continue;

        playlistManager_->playlist_execute_default_action(playlist, item);
        return true;
    }

    return false;
}

void PlayerImpl::stop()
{
    playbackControl_->stop();
}

void PlayerImpl::pause()
{
    playbackControl_->pause(true);
}

void PlayerImpl::playOrPause()
{
    playbackControl_->play_or_pause();
}

void PlayerImpl::togglePause()
{
    playbackControl_->toggle_pause();
}

void PlayerImpl::setMuted(Switch val)
{
    switch (val)
    {
    case Switch::SW_FALSE:
        if (playbackControl_->is_muted())
            playbackControl_->volume_mute_toggle();
        break;

    case Switch::SW_TRUE:
        if (!playbackControl_->is_muted())
            playbackControl_->volume_mute_toggle();
        break;

    case Switch::SW_TOGGLE:
        playbackControl_->volume_mute_toggle();
        break;
    }
}

void PlayerImpl::seekAbsolute(double offsetSeconds)
{
    playbackControl_->playback_seek(offsetSeconds);
}

void PlayerImpl::seekRelative(double offsetSeconds)
{
    playbackControl_->playback_seek_delta(offsetSeconds);
}

void PlayerImpl::setVolumeAbsolute(double val)
{
    playbackControl_->set_volume(static_cast<float>(clampVolume(val)));
}

void PlayerImpl::setVolumeRelative(double val)
{
    playbackControl_->set_volume(static_cast<float>(clampVolume(playbackControl_->get_volume() + val)));
}

void PlayerImpl::volumeUp()
{
    playbackControl_->volume_up();
}

void PlayerImpl::volumeDown()
{
    playbackControl_->volume_down();
}

}
}
