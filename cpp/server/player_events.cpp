#include "player_events.hpp"

#include <assert.h>

namespace msrv {

EventDispatcher::EventDispatcher()
{
}

EventDispatcher::~EventDispatcher()
{
}

std::unique_ptr<EventListener> EventDispatcher::createListener(const EventSet& eventMask)
{
    std::unique_ptr<EventListener> listener(new EventListener(eventMask));

    {
        std::lock_guard<std::mutex> lock(mutex_);
        listeners_.insert(listener.get());
        listener->owner_ = this;
    }

    return listener;
}

void EventDispatcher::dispatch(PlayerEvent event)
{
    std::lock_guard<std::mutex> lock(mutex_);

    for (auto listener: listeners_)
        if (listener->eventMask_.test(event))
            listener->pendingEvents_.set(event);
}

EventListener::EventListener(const EventSet& eventMask)
    : owner_(nullptr), eventMask_(eventMask), pendingEvents_(eventMask)
{
}

EventListener::~EventListener()
{
    if (!owner_)
        return;

    std::lock_guard<std::mutex> lock(owner_->mutex_);

    auto it = owner_->listeners_.find(this);
    assert(it != owner_->listeners_.end());
    owner_->listeners_.erase(it);
}

EventSet EventListener::readEvents()
{
    std::lock_guard<std::mutex> lock(owner_->mutex_);

    auto events = pendingEvents_;
    pendingEvents_.reset();
    return events;
}

}
