#pragma once

#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Player;
class Router;

class ClientConfigController : public ControllerBase
{
public:
    ClientConfigController(Request* request, SettingsDataPtr settings, const char* appName);
    ~ClientConfigController() = default;

    ResponsePtr getConfig();
    void setConfig();
    void removeConfig();

    static void defineRoutes(Router* router, WorkQueue* workQueue, SettingsDataPtr settings, const char* appName);

private:
    Path getFilePath();

    void checkPermissions()
    {
        settings_->ensurePermissions(ApiPermissions::CHANGE_CLIENT_CONFIG);
    }

    SettingsDataPtr settings_;
    const char* appName_;
};

}
