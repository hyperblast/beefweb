#include "player_events.hpp"

#include <assert.h>

namespace msrv {

std::unique_ptr<EventListener> EventDispatcher::createListener(PlayerEvents eventMask)
{
    std::unique_ptr<EventListener> listener(new EventListener(eventMask));

    {
        std::lock_guard<std::mutex> lock(mutex_);
        listeners_.insert(listener.get());
        listener->owner_ = this;
    }

    return listener;
}

void EventDispatcher::dispatch(PlayerEvents events)
{
    std::lock_guard<std::mutex> lock(mutex_);

    for (auto listener : listeners_)
    {
        auto maskedEvents = listener->eventMask_ & events;

        if (maskedEvents != PlayerEvents::NONE)
        {
            listener->pendingEvents_.fetch_or(static_cast<int>(maskedEvents));
        }
    }
}

EventListener::EventListener(PlayerEvents eventMask)
    : owner_(nullptr), eventMask_(eventMask), pendingEvents_(static_cast<int>(eventMask))
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

PlayerEvents EventListener::readEvents()
{
    return static_cast<PlayerEvents>(pendingEvents_.exchange(0));
}

}
