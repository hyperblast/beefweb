#include "utils.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

Fb2kLogger::Fb2kLogger()
    : prefix_(MSRV_PROJECT_ID ": ")
{
}

Fb2kLogger::~Fb2kLogger() = default;

void Fb2kLogger::log(LogLevel, const char* fmt, va_list va)
{
    console::printfv((prefix_ + fmt).c_str(), va);
}

Fb2kWorkQueue::Fb2kWorkQueue() = default;
Fb2kWorkQueue::~Fb2kWorkQueue() = default;

void Fb2kWorkQueue::schedule(WorkCallback callback)
{
    fb2k::inMainThread(std::move(callback));
}

PlayerEventAdapter::PlayerEventAdapter()
{
    const auto flags = flag_on_playback_all
        & ~(flag_on_playback_dynamic_info | flag_on_playback_time)
        | flag_on_volume_change;

    play_callback_manager::get()->register_callback(this, flags, false);
}

PlayerEventAdapter::~PlayerEventAdapter()
{
    play_callback_manager::get()->unregister_callback(this);
}

PlaylistEventAdapter::PlaylistEventAdapter()
{
    const auto flags = flag_on_items_added
        | flag_on_items_reordered
        | flag_on_items_removed
        | flag_on_items_modified
        | flag_on_items_replaced
        | flag_on_playlist_activate
        | flag_on_playlist_created
        | flag_on_playlists_reorder
        | flag_on_playlists_removed
        | flag_on_playlist_renamed
        | flag_on_playback_order_changed;

    playlist_manager::get()->register_callback(this, flags);
}

PlaylistEventAdapter::~PlaylistEventAdapter()
{
    playlist_manager::get()->unregister_callback(this);
}

}
}
