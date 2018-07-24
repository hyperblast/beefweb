#include "asio_adapters.hpp"
#include "log.hpp"

namespace msrv {

AsioWorkQueue::AsioWorkQueue(boost::asio::io_context* context)
    : context_(context) { }

AsioWorkQueue::~AsioWorkQueue() = default;

void AsioWorkQueue::schedule()
{
    boost::asio::post(context_->get_executor(), [this] { execute(); });
}

AsioTimer::AsioTimer(boost::asio::io_context* context)
    : timer_(*context)
{
}

AsioTimer::~AsioTimer()
{
    stop();
}

void AsioTimer::runOnce(DurationMs delay)
{
    schedule(delay);
    state_ = TimerState::RUNNING;
    period_ = DurationMs::zero();
}

void AsioTimer::runPeriodic(DurationMs period)
{
    schedule(period);
    state_ = TimerState::RUNNING;
    period_ = period;
}

void AsioTimer::stop()
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
        timer_.cancel();
        break;
    }
}

void AsioTimer::schedule(DurationMs delay)
{
    timer_.expires_from_now(boost::posix_time::millisec(delay.count()));
    timer_.async_wait([this] (const boost::system::error_code& error) { onComplete(error); });
}

void AsioTimer::onComplete(const boost::system::error_code& error)
{
    if (error == boost::asio::error::operation_aborted)
        return;

    state_ = isPeriodic() ? TimerState::WILL_RESTART : TimerState::STOPPED;

    if (callback_)
        tryCatchLog([this] { callback_(this); });

    if (state_ == TimerState::WILL_RESTART)
        schedule(period_);
}

AsioTimerFactory::AsioTimerFactory(boost::asio::io_context* context)
    : context_(context) { }

AsioTimerFactory::~AsioTimerFactory() = default;

TimerPtr AsioTimerFactory::createTimer()
{
    return std::make_unique<AsioTimer>(context_);
}

}
