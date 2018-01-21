#include "timers.hpp"
#include "log.hpp"

#include <assert.h>

namespace msrv {

TimeSource::~TimeSource() = default;

Timer::Timer(TimerQueue* queue, TimerCallback callback)
    : queue_(queue), callback_(callback), state_(TimerState::STOPPED)
{
}

Timer::~Timer()
{
    stop();
}

void Timer::runOnce(DurationMs period)
{
    stop();

    runAt_ = queue_->source_->currentTime() + period;
    period_ = DurationMs::zero();

    queue_->add(this);

    state_ = TimerState::RUNNING;
}

void Timer::runPeriodic(DurationMs period)
{
    assert(period > DurationMs::zero());

    stop();

    runAt_ = queue_->source_->currentTime() + period;
    period_ = period;

    queue_->add(this);

    state_ = TimerState::RUNNING;
}

void Timer::stop()
{
    switch (state_)
    {
    case TimerState::STOPPED:
        break;

    case TimerState::WILL_RESTART:
        state_ = TimerState::STOPPED;
        break;

    case TimerState::RUNNING:
        state_ = TimerState::STOPPED;
        queue_->remove(this);
        break;
    }
}

void Timer::run(TimePointMs now)
{
    state_ = isPeriodic() ? TimerState::WILL_RESTART : TimerState::STOPPED;

    if (callback_)
        tryCatchLog([this] { callback_(this); });

    if (state_ == TimerState::WILL_RESTART)
    {
        runAt_ = now + period_;
        queue_->add(this);
        state_ = TimerState::RUNNING;
    }
}

TimerQueue::TimerQueue(TimeSource* source)
    : source_(source)
{
}

TimerQueue::~TimerQueue() = default;

void TimerQueue::execute()
{
    auto now = source_->currentTime();

    while (!timers_.empty())
    {
        auto first = timers_.begin();
        auto timer = *first;

        if (now < timer->runAt_)
            break;

        timers_.erase(first);
        timer->run(now);
    }
}

}
