#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "player_events.hpp"

#include <memory>

namespace msrv {

class Router;

class QueryController : public ControllerBase
{
public:
    QueryController(Request* request, Player* player, EventDispatcher* dispatcher);
    ~QueryController();

    ResponsePtr query();
    ResponsePtr getEvents();
    ResponsePtr getUpdates();

    static void defineRoutes(Router* router, Player* player, EventDispatcher* dispatcher);

private:
    EventSet readEventMask();
    void createQueries(const EventSet& events);
    void listenForEvents(const EventSet& events);

    Json eventsToJson(const EventSet& changeSet);
    Json stateToJson(const EventSet& changeSet);

    Player* player_;
    EventDispatcher* dispatcher_;

    std::unique_ptr<EventListener> listener_;
    std::unique_ptr<TrackQuery> trackQuery_;
    std::unique_ptr<PlaylistQuery> playlistQuery_;
};

}
