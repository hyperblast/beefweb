#pragma once

#include "common.hpp"
#include "../log.hpp"
#include "../work_queue.hpp"
#include "../player_api.hpp"

namespace msrv {
namespace player_foobar2000 {

using TitleFormatVector = std::vector<service_ptr_t<titleformat_object>>;

class Fb2kLogger : public Logger
{
public:
    Fb2kLogger();
    ~Fb2kLogger() override;
    void log(LogLevel, const char*, va_list va) override;

private:
    std::string prefix_;
};

class Fb2kWorkQueue : public ExternalWorkQueue
{
public:
    Fb2kWorkQueue();
    ~Fb2kWorkQueue() override;

protected:
    void schedule(WorkCallback callback) override;
};

class PlayerEventAdapter final : private play_callback
{
public:
    PlayerEventAdapter();
    ~PlayerEventAdapter();

    void setCallback(PlayerEventsCallback callback)
    {
        callback_ = std::move(callback);
    }

private:
    void on_playback_starting(play_control::t_track_command p_command, bool p_paused)
    override
    {
        notify();
    }

    void on_playback_new_track(metadb_handle_ptr p_track) override
    {
        notify();
    }

    void on_playback_stop(play_control::t_stop_reason p_reason) override
    {
        notify();
    }

    void on_playback_seek(double p_time) override
    {
        notify();
    }

    void on_playback_pause(bool p_state) override
    {
        notify();
    }

    void on_playback_edited(metadb_handle_ptr p_track) override
    {
        notify();
    }

    void on_playback_dynamic_info(const file_info& p_info) override
    {
        /* ignore */
    }

    void on_playback_dynamic_info_track(const file_info& p_info) override
    {
        notify();
    }

    void on_playback_time(double p_time) override
    {
        /* ignore */
    }

    void on_volume_change(float p_new_val) override
    {
        notify();
    }

    void notify()
    {
        if (callback_)
            callback_(PlayerEvents::PLAYER_CHANGED);
    }

    PlayerEventsCallback callback_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerEventAdapter);
};

class PlaylistEventAdapter final : private playlist_callback
{
public:
    PlaylistEventAdapter();
    ~PlaylistEventAdapter();

    void setCallback(PlayerEventsCallback callback)
    {
        callback_ = std::move(callback);
    }

private:
    void on_items_added(
        t_size p_playlist,
        t_size p_start,
        const pfc::list_base_const_t<metadb_handle_ptr>& p_data,
        const bit_array& p_selection) override
    {
        notifyPlayerAndItems();
    }

    void on_items_reordered(
        t_size p_playlist,
        const t_size* p_order,
        t_size p_count) override
    {
        notifyPlayerAndItems();
    }

    void on_items_removing(
        t_size p_playlist,
        const bit_array& p_mask,
        t_size p_old_count,
        t_size p_new_count) override
    {
        /* ignore */
    }

    void on_items_removed(
        t_size p_playlist,
        const bit_array& p_mask,
        t_size p_old_count,
        t_size p_new_count) override
    {
        notifyPlayerAndItems();
    }

    void on_items_selection_change(
        t_size p_playlist,
        const bit_array& p_affected,
        const bit_array& p_state)
    override
    {
        /* ignore */
    }

    void on_item_focus_change(
        t_size p_playlist, t_size p_from, t_size p_to) override
    {
        /* ignore */
    }

    void on_items_modified(t_size p_playlist, const bit_array& p_mask) override
    {
        notifyPlayerAndItems();
    }

    void on_items_modified_fromplayback(
        t_size p_playlist,
        const bit_array& p_mask,
        play_control::t_display_level p_level) override
    {
        /* ignore */
    }

    void on_items_replaced(
        t_size p_playlist,
        const bit_array& p_mask,
        const pfc::list_base_const_t<t_on_items_replaced_entry>& p_data) override
    {
        notifyPlayerAndItems();
    }

    void on_item_ensure_visible(t_size p_playlist, t_size p_idx) override
    {
        /* ignore */
    }

    void on_playlist_activate(t_size p_old, t_size p_new) override
    {
        notifyPlaylists();
    }

    void on_playlist_created(t_size p_index, const char* p_name, t_size p_name_len) override
    {
        notifyPlaylists();
    }

    void on_playlists_reorder(const t_size* p_order, t_size p_count) override
    {
        notifyPlayerAndPlaylists();
    }

    void on_playlists_removing(const bit_array& p_mask, t_size p_old_count, t_size p_new_count) override
    {
        /* ignore */
    }

    void on_playlists_removed(const bit_array& p_mask, t_size p_old_count, t_size p_new_count) override
    {
        notifyPlayerAndPlaylists();
    }

    void on_playlist_renamed(t_size p_index, const char* p_new_name, t_size p_new_name_len) override
    {
        notifyPlaylists();
    }

    void on_default_format_changed() override
    {
        /* ignore */
    }

    void on_playback_order_changed(t_size p_new_index) override
    {
        notifyPlayer();
    }

    void on_playlist_locked(t_size p_playlist, bool p_locked) override
    {
        /* ignore */
    }

    void notifyPlayer() const
    {
        if (callback_)
            callback_(PlayerEvents::PLAYER_CHANGED);
    }

    void notifyPlayerAndItems() const
    {
        if (callback_)
        {
            callback_(PlayerEvents::PLAYER_CHANGED | PlayerEvents::PLAYLIST_ITEMS_CHANGED);
        }
    }

    void notifyPlayerAndPlaylists() const
    {
        if (callback_)
        {
            callback_(PlayerEvents::PLAYER_CHANGED | PlayerEvents::PLAYLIST_SET_CHANGED);
        }
    }

    void notifyPlaylists() const
    {
        if (callback_)
            callback_(PlayerEvents::PLAYLIST_SET_CHANGED);
    }

    PlayerEventsCallback callback_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistEventAdapter);
};

}
}
