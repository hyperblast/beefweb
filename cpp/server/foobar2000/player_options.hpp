#pragma once

#include "common.hpp"
#include "player_api.hpp"

namespace msrv::player_foobar2000 {
class PlaybackOrderOption : public EnumPlayerOption
{
public:
    explicit PlaybackOrderOption(playlist_manager_v4* playlistManager);
    int32_t getValue() const override;
    void setValue(int32_t value) override;

private:
    playlist_manager_v4* playlistManager_;

    static std::vector<std::string> getEnumNames(playlist_manager_v4* playlistManager);
};

class StopAfterCurrentTrackOption : public BoolPlayerOption
{
public:
    explicit StopAfterCurrentTrackOption(playback_control* playbackControl);

    bool getValue() const override;
    void setValue(bool value) override;

    void setCallback(PlayerEventsCallback callback)
    {
        callback_ = std::move(callback);
    }

private:
    playback_control* playbackControl_;
    PlayerEventsCallback callback_;
};

}
