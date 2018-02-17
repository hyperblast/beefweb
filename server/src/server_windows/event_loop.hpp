#pragma once

#include "../defines.hpp"
#include "../timers.hpp"
#include "iocp.hpp"

#include <memory>

namespace msrv {
namespace server_windows {

class EventLoop final : public TimeSource
{
public:
    EventLoop(IoCompletionPort* ioPort);
    ~EventLoop();

    TimerFactory* timerFactory() { return timerQueue_.get(); }
    virtual TimePointMs currentTime() override { return now_; }
    void run();
    void exit() { ioPort_->post(exitTask_); }

private:
    void executeTasks();

    IoCompletionPort* ioPort_;
    std::unique_ptr<SimpleTimerQueue> timerQueue_;
    TimePointMs now_;
    TaskPtr<CallbackTask> exitTask_;
    bool wantExit_;

    MSRV_NO_COPY_AND_ASSIGN(EventLoop);
};

}}
