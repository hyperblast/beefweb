#pragma once

#include "common.hpp"
#include "../log.hpp"
#include "../work_queue.hpp"
#include "../player_api.hpp"

namespace msrv {
namespace player_foobar2000 {

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
    virtual void on_playback_starting(play_control::t_track_command p_command, bool p_paused) override { notify(); }
    virtual void on_playback_new_track(metadb_handle_ptr p_track) override { notify(); }
    virtual void on_playback_stop(play_control::t_stop_reason p_reason)  override { notify(); }
    virtual void on_playback_seek(double p_time) override { notify(); }
    virtual void on_playback_pause(bool p_state)  override { notify(); }
    virtual void on_playback_edited(metadb_handle_ptr p_track) override { notify(); }
    virtual void on_playback_dynamic_info(const file_info & p_info) override { /* ignore */ }
    virtual void on_playback_dynamic_info_track(const file_info & p_info)  override { notify(); }
    virtual void on_playback_time(double p_time) override { /* ignore */ }
    virtual void on_volume_change(float p_new_val) override { notify(); }

    void notify()
    {
        if (callback_)
            callback_(PlayerEvent::PLAYER_CHANGED);
    }

    PlayerEventCallback callback_;
};

}}
