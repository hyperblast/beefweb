#pragma once

#include "defines.hpp"
#include "chrono.hpp"

#include <assert.h>

#include <utility>
#include <functional>
#include <set>
#include <memory>

#include <boost/optional.hpp>

namespace msrv {

class Timer;
class TimerFactory;
class TimeSource;
class SimpleTimer;
class SimpleTimerQueue;

using TimerPtr = std::unique_ptr<Timer>;
using TimerCallback = std::function<void(Timer*)>;

enum class TimerState
{
    STOPPED,
    WILL_RESTART,
    RUNNING
};

class Timer
{
public:
    Timer() = default;
    virtual ~Timer();

    virtual TimerState state() const = 0;
    virtual DurationMs period() const = 0;

    virtual void setCallback(TimerCallback callback) = 0;
    virtual void runOnce(DurationMs delay = DurationMs::zero()) = 0;
    virtual void runPeriodic(DurationMs period) = 0;
    virtual void stop() = 0;

    bool isActive() const
    {
        return state() != TimerState::STOPPED;
    }
    bool isPeriodic() const
    {
        return period() > DurationMs::zero();
    }

private:
    MSRV_NO_COPY_AND_ASSIGN(Timer);
};

class TimerFactory
{
public:
    TimerFactory() = default;
    virtual ~TimerFactory();
    virtual TimerPtr createTimer() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(TimerFactory);
};

class TimeSource
{
public:
    TimeSource() = default;
    virtual ~TimeSource();
    virtual TimePointMs currentTime() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(TimeSource);
};

class SimpleTimer final : public Timer
{
public:
    SimpleTimer(SimpleTimerQueue* queue)
        : queue_(queue), state_(TimerState::STOPPED)
    {
    }

    virtual ~SimpleTimer();

    virtual TimerState state() const override
    {
        return state_;
    }
    virtual DurationMs period() const override
    {
        return period_;
    }

    virtual void setCallback(TimerCallback callback) override
    {
        callback_ = std::move(callback);
    }
    virtual void runOnce(DurationMs delay) override;
    virtual void runPeriodic(DurationMs period) override;
    virtual void stop() override;

    TimePointMs runAt() const
    {
        return runAt_;
    }

private:
    friend class SimpleTimerQueue;

    void run(TimePointMs now);

    SimpleTimerQueue* queue_;
    TimerCallback callback_;
    TimerState state_;
    DurationMs period_;
    TimePointMs runAt_;

    MSRV_NO_COPY_AND_ASSIGN(SimpleTimer);
};

class SimpleTimerQueue final : public TimerFactory
{
public:
    SimpleTimerQueue(TimeSource* source);
    virtual ~SimpleTimerQueue();

    virtual TimerPtr createTimer() override
    {
        return std::make_unique<SimpleTimer>(this);
    }

    boost::optional<TimePointMs> nextTimeout() const
    {
        if (timers_.empty())
            return boost::none;

        return (*timers_.begin())->runAt_;
    }

    void execute()
    {
        bool wantExit = false;
        execute(&wantExit);
    }

    void execute(const bool* wantExit);

private:
    friend class SimpleTimer;

    struct TimerComparer
    {
        bool operator()(SimpleTimer* left, SimpleTimer* right) const noexcept
        {
            if (left->runAt_ < right->runAt_)
                return true;

            if (left->runAt_ == right->runAt_)
                return left < right;

            return false;
        }
    };

    TimeSource* source_;
    std::set<SimpleTimer*, TimerComparer> timers_;

    void add(SimpleTimer* timer)
    {
        timers_.insert(timer);
    }

    void remove(SimpleTimer* timer)
    {
        auto it = timers_.find(timer);
        assert(it != timers_.end());
        timers_.erase(it);
    }

    MSRV_NO_COPY_AND_ASSIGN(SimpleTimerQueue);
};

}
