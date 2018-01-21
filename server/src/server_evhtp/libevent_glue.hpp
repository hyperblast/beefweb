#pragma once

#include "../defines.hpp"
#include "../system.hpp"
#include "../work_queue.hpp"

#include <functional>
#include <memory>

#include <event2/event.h>
#include <event2/buffer.h>
#include <event2/thread.h>

namespace msrv {
namespace server_evhtp {

class Event;
class EventBase;

using EventBasePtr = std::unique_ptr<EventBase>;
using EventPtr = std::unique_ptr<Event>;

using EventCallback = std::function<void(Event*, int)>;

class EventBase
{
public:
    EventBase();
    ~EventBase();

    static void initThreads();

    ::event_base* ptr() { return ptr_; }

    void makeNotifiable();
    void initPriorities(int prioCount);
    bool runLoop(int flags = 0);
    void breakLoop();

private:
    ::event_base* ptr_;

    MSRV_NO_COPY_AND_ASSIGN(EventBase);
};

class Event
{
public:
    Event(EventBase* base, SocketHandle socket, int events);
    ~Event();

    EventBase* base() { return base_; }
    ::event* ptr() { return ptr_; }

    void onEvent(EventCallback callback) { callback_ = std::move(callback); }
    void setPriority(int prio);
    void schedule(uint32_t sec = 0, uint32_t usec = 0);

private:
    static void runCallback(evutil_socket_t, short, void*);

    EventBase* base_;
    ::event* ptr_;
    EventCallback callback_;

    MSRV_NO_COPY_AND_ASSIGN(Event);
};

class Evbuffer
{
public:
    Evbuffer();

    Evbuffer(Evbuffer&&) = default;

    Evbuffer(::evbuffer* ptr, bool owned = true)
        : ptr_(ptr), owned_(owned) { }

    ~Evbuffer();

    Evbuffer& operator=(Evbuffer&&) = default;

    ::evbuffer* ptr() { return ptr_; }

    size_t length() { return evbuffer_get_length(ptr()); }

    std::vector<char> readToEnd();

    void write(const char*, size_t);
    void write(const std::string& str) { write(str.data(), str.length()); }
    void writeFile(FileHandle file, int64_t offset, int64_t size);

    template<size_t N>
    void write(char data[N]) { write(data, N - 1); }

private:
    ::evbuffer* ptr_;
    bool owned_;

    MSRV_NO_COPY_AND_ASSIGN(Evbuffer);
};

class EventBaseWorkQueue : public ExternalWorkQueue
{
public:
    EventBaseWorkQueue(EventBase* base, int prio = -1);
    ~EventBaseWorkQueue();

protected:
    virtual void schedule() override;

private:
    Event notifyEvent_;
};

}}
