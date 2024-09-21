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

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player, EventDispatcher* dispatcher);

private:
    PlayerEvents readEventMask();
    void createQueries(PlayerEvents events);
    void listenForEvents(PlayerEvents events);

    static Json eventsToJson(PlayerEvents events);
    Json stateToJson(PlayerEvents events);

    Player* player_;
    EventDispatcher* dispatcher_;

    std::unique_ptr<EventListener> listener_;
    std::unique_ptr<TrackQuery> trackQuery_;
    std::unique_ptr<PlaylistQuery> playlistQuery_;
};

}
