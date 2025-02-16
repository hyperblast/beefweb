#pragma once

#include "controller.hpp"

namespace msrv {

class Router;

class Player;

class OutputsController : public ControllerBase
{
public:
    OutputsController(Request* request, Player* player);

    ResponsePtr getAll();
    void setActive();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player);

private:
    Player* player_;

    MSRV_NO_COPY_AND_ASSIGN(OutputsController);
};

}
