#pragma once

#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Player;
class Router;

class ClientConfigController : public ControllerBase
{
public:
    ClientConfigController(Request* request, SettingsDataPtr settings);
    ~ClientConfigController() = default;

    ResponsePtr getConfig();
    void setConfig();
    void removeConfig();

    static void defineRoutes(Router* router, WorkQueue* workQueue, SettingsDataPtr settings);

private:
    Path getFilePath();

    void checkPermissions()
    {
        settings_->ensurePermissions(ApiPermissions::CHANGE_CLIENT_CONFIG);
    }

    SettingsDataPtr settings_;
};

}
