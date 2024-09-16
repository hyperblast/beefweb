#include "timers.hpp"
#include "log.hpp"

#include <assert.h>

namespace msrv {

Timer::~Timer() = default;
TimerFactory::~TimerFactory() = default;
TimeSource::~TimeSource() = default;

SimpleTimer::~SimpleTimer()
{
    stop();
}

void SimpleTimer::runOnce(DurationMs delay)
{
    stop();

    runAt_ = queue_->source_->currentTime() + delay;
    period_ = DurationMs::zero();

    queue_->add(this);

    state_ = TimerState::RUNNING;
}

void SimpleTimer::runPeriodic(DurationMs period)
{
    assert(period > DurationMs::zero());

    stop();

    runAt_ = queue_->source_->currentTime() + period;
    period_ = period;

    queue_->add(this);

    state_ = TimerState::RUNNING;
}

void SimpleTimer::stop()
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

void SimpleTimer::run(TimePointMs now)
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

SimpleTimerQueue::SimpleTimerQueue(TimeSource* source)
    : source_(source)
{
}

SimpleTimerQueue::~SimpleTimerQueue() = default;

void SimpleTimerQueue::execute(const bool* wantExit)
{
    auto now = source_->currentTime();

    while (!timers_.empty() && !*wantExit)
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
