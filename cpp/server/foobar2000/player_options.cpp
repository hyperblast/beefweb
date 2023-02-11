#include "player_options.hpp"

namespace msrv::player_foobar2000
{

PlaybackOrderOption::PlaybackOrderOption(playlist_manager_v4* playlistManager)
    : EnumPlayerOption("playbackOrder", "Playback order", getEnumNames(playlistManager)),
      playlistManager_(playlistManager)
{
}

int32_t PlaybackOrderOption::getValue()
{
    return static_cast<int32_t>(playlistManager_->playback_order_get_active());
}

void PlaybackOrderOption::setValue(int32_t value)
{
    playlistManager_->playback_order_set_active(value);
}

std::vector<std::string> PlaybackOrderOption::getEnumNames(playlist_manager_v4* playlistManager)
{
    std::vector<std::string> names;

    const auto count = playlistManager->playback_order_get_count();

    names.reserve(count);

    for (t_size i = 0; i < count; i++)
        names.emplace_back(playlistManager->playback_order_get_name(i));

    return names;
}

StopAfterCurrentTrackOption::StopAfterCurrentTrackOption(playback_control* playbackControl)
    : BoolPlayerOption("stopAfterCurrentTrack", "Stop after current track"), playbackControl_(playbackControl)
{
}

bool StopAfterCurrentTrackOption::getValue()
{
    return playbackControl_->get_stop_after_current();
}

void StopAfterCurrentTrackOption::setValue(bool value)
{
    playbackControl_->set_stop_after_current(value);
}

}
