#pragma once

#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Player;
class Router;

class UserConfigController : public ControllerBase
{
public:
    UserConfigController(Request* request, const char* appName);
    ~UserConfigController() = default;

    ResponsePtr getConfig();
    void setConfig();
    void clearConfig();

    static void defineRoutes(Router* router, WorkQueue* workQueue, const char* appName);

private:
    Path getFilePath();

    const char* appName_;
};

}