#pragma once

#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Player;
class Router;

class ClientConfigController : public ControllerBase
{
public:
    ClientConfigController(Request* request, const char* appName);
    ~ClientConfigController() = default;

    ResponsePtr getConfig();
    void setConfig();
    void removeConfig();

    static void defineRoutes(Router* router, WorkQueue* workQueue, const char* appName);

private:
    Path getFilePath();

    const char* appName_;
};

}
