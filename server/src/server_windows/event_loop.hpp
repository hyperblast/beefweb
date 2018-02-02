#pragma once

#include "../defines.hpp"
#include "../timers.hpp"

#include <memory>

namespace msrv {
namespace server_windows {

class IoCompletionPort;

class EventLoop final : public TimeSource
{
public:
    EventLoop(IoCompletionPort* ioPort);
    ~EventLoop();

    void run();
    void exit() { exited_ = true; }

    virtual TimePointMs currentTime() override { return now_; }

    std::unique_ptr<Timer> createTimer(TimerCallback callback = TimerCallback())
    {
        return std::make_unique<Timer>(timerQueue_.get(), std::move(callback));
    }

private:
    void executeTasks();
    void discardTasks();

    IoCompletionPort* ioPort_;
    std::unique_ptr<TimerQueue> timerQueue_;
    TimePointMs now_;
    bool exited_;

    MSRV_NO_COPY_AND_ASSIGN(EventLoop);
};

}}
