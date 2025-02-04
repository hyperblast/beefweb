#pragma once

#include "controller.hpp"

namespace msrv {

class Router;

class Player;

class PlayQueueController : public ControllerBase
{
public:
    PlayQueueController(Request* request, Player* player);

    ResponsePtr getQueue();
    void addToQueue();
    void removeFromQueue();
    void clearQueue();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player);

private:
    Player* player_;

    MSRV_NO_COPY_AND_ASSIGN(PlayQueueController);
};

}
