#pragma once

#include "defines.hpp"
#include "chrono.hpp"

#include <assert.h>

#include <utility>
#include <functional>
#include <set>

#include <boost/optional.hpp>

namespace msrv {

class TimeSource;
class Timer;
class TimerQueue;

using TimerCallback = std::function<void(Timer*)>;

class TimeSource
{
public:
    TimeSource() = default;
    virtual ~TimeSource();
    virtual TimePointMs currentTime() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(TimeSource);
};

enum class TimerState
{
    STOPPED,
    WILL_RESTART,
    RUNNING
};

class Timer
{
public:
    Timer(TimerQueue* queue, TimerCallback callback = TimerCallback());
    ~Timer();

    TimerState state() const { return state_; }
    TimePointMs runAt() const { return runAt_; }
    DurationMs period() const { return period_; }

    bool isActive() const { return state_ != TimerState::STOPPED; }
    bool isPeriodic() const { return period_ > DurationMs::zero(); }

    void setCallback(TimerCallback callback) { callback_ = std::move(callback); }
    void runOnce() { runOnce(DurationMs::zero()); }
    void runOnce(DurationMs period);
    void runPeriodic(DurationMs period);
    void stop();

private:
    friend class TimerQueue;

    void run(TimePointMs now);

    TimerQueue* queue_;
    TimerCallback callback_;
    TimerState state_;
    TimePointMs runAt_;
    DurationMs period_;

    MSRV_NO_COPY_AND_ASSIGN(Timer);
};

class TimerQueue
{
public:
    TimerQueue(TimeSource* source);
    ~TimerQueue();

    boost::optional<TimePointMs> nextTimeout() const
    {
        if (timers_.empty())
            return boost::none;

        return (*timers_.begin())->runAt_;
    }

    void execute()
    {
        bool exited = false;
        execute(&exited);
    }

    void execute(const bool* exited);

private:
    friend class Timer;

    struct TimerComparer
    {
        bool operator()(Timer* left, Timer* right) const noexcept
        {
            if (left->runAt_ < right->runAt_)
                return true;

            if (left->runAt_ == right->runAt_)
                return left < right;

            return false;
        }
    };

    TimeSource* source_;
    std::set<Timer*, TimerComparer> timers_;

    void add(Timer* timer)
    {
        timers_.insert(timer);
    }

    void remove(Timer* timer)
    {
        auto it = timers_.find(timer);
        assert(it != timers_.end());
        timers_.erase(it);
    }

    MSRV_NO_COPY_AND_ASSIGN(TimerQueue);
};

}
