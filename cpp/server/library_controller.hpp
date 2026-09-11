#pragma once

#include "defines.hpp"
#include "controller.hpp"

namespace msrv {

class Router;

class Player;

class WorkQueue;

class LibraryController : public ControllerBase
{
public:
    LibraryController(Request* request, Player* player);
    ~LibraryController();

    ResponsePtr getInfo();
    ResponsePtr getItems();
    ResponsePtr getItemsByPath();
    ResponsePtr getItemsByColumns();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player);

private:
    static ResponsePtr notSupportedResponse();

    Range readRange();

    Player* player_;

    MSRV_NO_COPY_AND_ASSIGN(LibraryController);
};

}
