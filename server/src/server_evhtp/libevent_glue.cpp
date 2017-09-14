#include "libevent_glue.hpp"

#include "../log.hpp"

#include <algorithm>
#include <mutex>

namespace msrv {
namespace server_evhtp {

namespace { std::once_flag initThreadsOnce; }

EventBase::EventBase()
    : ptr_(nullptr)
{
    ptr_ = ::event_base_new();
    throwIfFailed("event_base_new", ptr_ != nullptr);
}

EventBase::~EventBase()
{
    if (ptr_)
        ::event_base_free(ptr_);
}

void EventBase::initThreads()
{
    std::call_once(initThreadsOnce, [] {
        auto ret = ::evthread_use_pthreads();
        throwIfFailed("evthread_use_pthreads", ret >= 0);
    });
}

void EventBase::makeNotifiable()
{
    auto ret = ::evthread_make_base_notifiable(ptr());
    throwIfFailed("evthread_make_base_notifiable", ret >= 0);
}

void EventBase::initPriorities(int prioCount)
{
    auto ret = ::event_base_priority_init(ptr(), prioCount);
    throwIfFailed("event_base_priority_init",  ret >= 0);
}

bool EventBase::runLoop(int flags)
{
    auto ret = ::event_base_loop(ptr(), flags);
    throwIfFailed("event_base_loop", ret >= 0);
    return ret == 0;
}

void EventBase::breakLoop()
{
    auto ret = ::event_base_loopbreak(ptr());
    throwIfFailed("event_base_loopbreak", ret >= 0);
}

Event::Event(EventBase* base, SocketHandle socket, int events)
    : base_(base), ptr_(nullptr)
{
    ptr_ = ::event_new(base->ptr(), socket.get(), events, runCallback, this);
    throwIfFailed("event_new", ptr_ != nullptr);
    socket.release();
}

Event::~Event()
{
    if (ptr_)
        ::event_free(ptr_);
}

void Event::setPriority(int prio)
{
    auto ret = ::event_priority_set(ptr(), prio);
    throwIfFailed("event_priority_set", ret >= 0);
}

void Event::schedule(uint32_t sec, uint32_t usec)
{
    timeval tv = { static_cast<time_t>(sec), static_cast<suseconds_t>(usec) };
    auto ret = ::event_add(ptr(), &tv);
    throwIfFailed("event_add", ret >= 0);
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

EventBaseWorkQueue::EventBaseWorkQueue(EventBase *base, int prio)
{
    notifyEvent_.reset(new Event(base, SocketHandle(), 0));
    notifyEvent_->onEvent([this] (Event*, int) { executeAll(); });

    if (prio >= 0)
        notifyEvent_->setPriority(prio);
}

EventBaseWorkQueue::~EventBaseWorkQueue()
{
}

void EventBaseWorkQueue::enqueue(WorkCallback callback)
{
    {
        std::lock_guard<std::mutex> lock(mutex_);
        enqueued_.emplace_back(std::move(callback));
    }

    notifyEvent_->schedule();
}

void EventBaseWorkQueue::executeAll()
{
    {
        std::unique_lock<std::mutex> lock(mutex_);
        std::swap(executing_, enqueued_);
    }

    for (auto& item : executing_)
        tryCatchLog([&]{ item(); });

    executing_.clear();
}

} }
