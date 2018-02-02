#include "event_loop.hpp"
#include "iocp.hpp"
#include "../log.hpp"

namespace msrv {
namespace server_windows {

EventLoop::EventLoop(IoCompletionPort* ioPort)
    : ioPort_(ioPort), timerQueue_(), now_(steadyTime()), exited_(false)
{
    timerQueue_ = std::make_unique<TimerQueue>(this);
}

EventLoop::~EventLoop() = default;

void EventLoop::run()
{
    exited_ = false;

    while (!exited_)
    {
        executeTasks();
        timerQueue_->execute(&exited_);
    }

    discardTasks();
}

void EventLoop::executeTasks()
{
    OverlappedResult result;
    auto nextTimeout = timerQueue_->nextTimeout();
    bool hasResult;

    now_ = steadyTime();

    if (nextTimeout)
    {
        auto timeout = *nextTimeout - now_;

        if (timeout > DurationMs::zero())
            hasResult = ioPort_->waitResult(&result, timeout);
        else
            hasResult = ioPort_->getResult(&result);
    }
    else
        hasResult = ioPort_->waitResult(&result);

    now_ = steadyTime();

    while (hasResult && !exited_)
    {
        tryCatchLog([&] { result.task->execute(&result); });
        hasResult = ioPort_->getResult(&result);
    }
}

void EventLoop::discardTasks()
{
    OverlappedResult result;

    while (ioPort_->getResult(&result))
    {
    }
}

}}
