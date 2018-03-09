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
    virtual ~Fb2kLogger();
    virtual void log(LogLevel, const char*, va_list va) override;

private:
    std::string prefix_;
};

class Fb2kWorkQueue
    : public main_thread_callback,
      public ExternalWorkQueue
{
public:
    Fb2kWorkQueue();
    virtual ~Fb2kWorkQueue();
    virtual void callback_run() override;

protected:
    virtual void schedule() override;
};

class PlayerEventAdapter : private play_callback
{
public:
    PlayerEventAdapter();
    ~PlayerEventAdapter();

    void setCallback(PlayerEventCallback callback)
    {
        callback_ = std::move(callback);
    }

private:
    virtual void on_playback_starting(play_control::t_track_command p_command, bool p_paused)
        override { notify(); }

    virtual void on_playback_new_track(metadb_handle_ptr p_track)
        override { notify(); }
    
    virtual void on_playback_stop(play_control::t_stop_reason p_reason)
        override { notify(); }

    virtual void on_playback_seek(double p_time)
        override { notify(); }

    virtual void on_playback_pause(bool p_state)
        override { notify(); }

    virtual void on_playback_edited(metadb_handle_ptr p_track)
        override { notify(); }

    virtual void on_playback_dynamic_info(const file_info & p_info)
        override { /* ignore */ }

    virtual void on_playback_dynamic_info_track(const file_info & p_info)
        override { notify(); }
    
    virtual void on_playback_time(double p_time)
        override { /* ignore */ }

    virtual void on_volume_change(float p_new_val)
        override { notify(); }

    void notify()
    {
        if (callback_)
            callback_(PlayerEvent::PLAYER_CHANGED);
    }

    PlayerEventCallback callback_;
};

class PlaylistEventAdapter : private playlist_callback
{
public:
    PlaylistEventAdapter();
    ~PlaylistEventAdapter();

    void setCallback(PlayerEventCallback callback)
    {
        callback_ = std::move(callback);
    }

private:
    virtual void on_items_added(
        t_size p_playlist,
        t_size p_start,
        const pfc::list_base_const_t<metadb_handle_ptr> & p_data,
        const bit_array & p_selection)
        override { notifyItems(); }

    virtual void on_items_reordered(
        t_size p_playlist,
        const t_size * p_order,
        t_size p_count)
        override { notifyItems(); }

    virtual void on_items_removing(
        t_size p_playlist,
        const bit_array & p_mask,
        t_size p_old_count,
        t_size p_new_count)
        override { /* ignore */ }

    virtual void on_items_removed(
        t_size p_playlist,
        const bit_array & p_mask,
        t_size p_old_count,
        t_size p_new_count)
        override { notifyItems(); }

    virtual void on_items_selection_change(
        t_size p_playlist,
        const bit_array & p_affected,
        const bit_array & p_state)
        override { /* ignore */ }

    virtual void on_item_focus_change(
        t_size p_playlist, t_size p_from, t_size p_to)
        override { /* ignore */ }

    virtual void on_items_modified(
        t_size p_playlist, const bit_array & p_mask)
        override { notifyItems(); }

    virtual void on_items_modified_fromplayback(
        t_size p_playlist,
        const bit_array & p_mask,
        play_control::t_display_level p_level)
        override { /* ignore */ }

    virtual void on_items_replaced(
        t_size p_playlist,
        const bit_array & p_mask,
        const pfc::list_base_const_t<t_on_items_replaced_entry> & p_data)
        override { notifyItems(); }

    virtual void on_item_ensure_visible(t_size p_playlist, t_size p_idx)
        override { /* ignore */ }

    virtual void on_playlist_activate(t_size p_old, t_size p_new)
        override { notifySet(); }
    
    virtual void on_playlist_created(t_size p_index, const char * p_name, t_size p_name_len)
        override { notifySet(); }

    virtual void on_playlists_reorder(const t_size * p_order, t_size p_count)
        override { notifySet(); }

    virtual void on_playlists_removing(const bit_array & p_mask, t_size p_old_count, t_size p_new_count)
        override { /* ignore */ }

    virtual void on_playlists_removed(const bit_array & p_mask, t_size p_old_count, t_size p_new_count)
        override { notifySet(); }

    virtual void on_playlist_renamed(t_size p_index, const char * p_new_name, t_size p_new_name_len)
        override { notifySet(); }

    virtual void on_default_format_changed()
        override { /* ignore */ }

    virtual void on_playback_order_changed(t_size p_new_index)
        override { /* ignore */ }

    virtual void on_playlist_locked(t_size p_playlist, bool p_locked)
        override { /* ignore */ }

    void notifySet()
    {
        if (callback_)
            callback_(PlayerEvent::PLAYLIST_SET_CHANGED);
    }

    void notifyItems()
    {
        if (callback_)
            callback_(PlayerEvent::PLAYLIST_ITEMS_CHANGED);
    }

    PlayerEventCallback callback_;
};

}}
