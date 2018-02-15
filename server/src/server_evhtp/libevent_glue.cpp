#include "libevent_glue.hpp"

#include "../log.hpp"

#include <algorithm>
#include <mutex>

namespace msrv {
namespace server_evhtp {

namespace { std::once_flag initThreadsOnce; }

EventBase::EventBase(bool threadSafe)
    : ptr_(nullptr)
{
    if (threadSafe)
    {
        std::call_once(initThreadsOnce, []
        {
            auto ret = ::evthread_use_pthreads();
            throwIfFailed("evthread_use_pthreads", ret >= 0);
        });
    }

    ptr_ = ::event_base_new();
    throwIfFailed("event_base_new", ptr_ != nullptr);

    if (threadSafe)
    {
        auto ret = ::evthread_make_base_notifiable(ptr());
        throwIfFailed("evthread_make_base_notifiable", ret >= 0);
    }
}

EventBase::~EventBase()
{
    if (ptr_)
        ::event_base_free(ptr_);
}

bool EventBase::runLoop(int flags)
{
    auto ret = ::event_base_loop(ptr(), flags);
    throwIfFailed("event_base_loop", ret >= 0);
    return ret == 0;
}

void EventBase::exitLoop()
{
    auto ret = ::event_base_loopexit(ptr(), nullptr);
    throwIfFailed("event_base_loopbreak", ret >= 0);
}

Event::Event(EventBase* base, SocketHandle socket, int events, EventCallback callback)
    : base_(base), ptr_(nullptr), callback_(std::move(callback))
{
    ptr_ = ::event_new(base->ptr(), socket.get(), static_cast<short>(events), runCallback, this);
    throwIfFailed("event_new", ptr_ != nullptr);
    socket.release();
}

Event::~Event()
{
    if (ptr_)
        ::event_free(ptr_);
}

void Event::schedule(DurationMs timeout)
{
    auto sec = timeout.count() / 1000;
    auto usec = (timeout.count() % 1000) * 1000;
    timeval tv = { static_cast<time_t>(sec), static_cast<suseconds_t>(usec) };

    auto ret = ::event_add(ptr(), &tv);
    throwIfFailed("event_add", ret >= 0);
}

void Event::unschedule()
{
    auto ret = ::event_del(ptr());
    throwIfFailed("event_del", ret >= 0);
}

void Event::runCallback(evutil_socket_t, short events, void* thisPtr)
{
    auto thisObj = reinterpret_cast<Event*>(thisPtr);

    if (thisObj->callback_)
        tryCatchLog([&]{ thisObj->callback_(thisObj, events); });
}

Evbuffer::Evbuffer()
    : ptr_(nullptr), owned_(true)
{
    ptr_ = ::evbuffer_new();
    throwIfFailed("evbuffer_new", ptr_ != nullptr);
}

Evbuffer::~Evbuffer()
{
    if (ptr_ && owned_)
        ::evbuffer_free(ptr_);
}

std::vector<char> Evbuffer::readToEnd()
{
    std::vector<char> buffer(length());
    auto ret = ::evbuffer_remove(ptr(), buffer.data(), buffer.size());
    throwIfFailed("evbuffer_remove", ret >= 0);
    return buffer;
}

void Evbuffer::writeFile(FileHandle file, int64_t offset, int64_t size)
{
    auto ret = ::evbuffer_add_file(ptr(), file.get(), offset, size);
    throwIfFailed("evbuffer_add_file", ret >= 0);
    file.release();
}

void Evbuffer::write(const char* data, size_t size)
{
    auto ret = ::evbuffer_add(ptr(), data, size);
    throwIfFailed("evbuffer_add", ret >= 0);
}

EventBaseWorkQueue::EventBaseWorkQueue(EventBase *base)
    : notifyEvent_(base)
{
    notifyEvent_.setCallback([this] (Event*, int) { execute(); });
}

EventBaseWorkQueue::~EventBaseWorkQueue() = default;

EventTimer::EventTimer(EventBase* eventBase)
    : event_(eventBase), state_(TimerState::STOPPED)
{
    event_.setCallback([this] (Event*, int) { run(); });
}

EventTimer::~EventTimer()
{
    stop();
}

void EventTimer::runOnce(DurationMs delay)
{
    event_.schedule(delay);
    state_ = TimerState::RUNNING;
    period_ = DurationMs::zero();
}

void EventTimer::runPeriodic(DurationMs period)
{
    event_.schedule(period);
    state_ = TimerState::RUNNING;
    period_ = period;
}

void EventTimer::stop()
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
        event_.unschedule();
        break;
    }
}

void EventTimer::run()
{
    state_ = isPeriodic() ? TimerState::WILL_RESTART : TimerState::STOPPED;

    if (callback_)
        tryCatchLog([this] { callback_(this); });

    if (state_ == TimerState::WILL_RESTART)
        event_.schedule(period_);
}

EventTimerFactory::~EventTimerFactory() = default;

}}
