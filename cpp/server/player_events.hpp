#pragma once

#include "defines.hpp"
#include "player_api.hpp"

#include <unordered_set>
#include <bitset>
#include <mutex>
#include <memory>

namespace msrv {

class EventSet
{
public:
    bool any() const
    {
        return events_.any();
    }
    bool test(PlayerEvent event) const
    {
        return events_.test((int) event);
    }
    void set(PlayerEvent event)
    {
        events_.set((int) event);
    }
    void reset()
    {
        events_.reset();
    }

private:
    std::bitset<(int) PlayerEvent::COUNT> events_;
};

class EventListener;

class EventDispatcher
{
public:
    EventDispatcher();
    ~EventDispatcher();

    std::unique_ptr <EventListener> createListener(const EventSet& eventMask);
    void dispatch(PlayerEvent event);

private:
    friend class EventListener;

    std::mutex mutex_;
    std::unordered_set<EventListener*> listeners_;

    MSRV_NO_COPY_AND_ASSIGN(EventDispatcher);
};

class EventListener
{
public:
    ~EventListener();
    EventSet readEvents();

private:
    friend class EventDispatcher;

    EventListener(const EventSet& eventMask);

    EventDispatcher* owner_;
    const EventSet eventMask_;
    EventSet pendingEvents_;

    MSRV_NO_COPY_AND_ASSIGN(EventListener);
};

}
