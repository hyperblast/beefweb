#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Router;
class SettingsStore;
class WorkQueue;

class BrowserController : public ControllerBase
{
public:
    BrowserController(Request* request, SettingsDataPtr settings);
    ~BrowserController();

    ResponsePtr getRoots();
    ResponsePtr getEntries();

    static void defineRoutes(Router* router, WorkQueue* workQueue, SettingsDataPtr settings);

private:
    SettingsDataPtr settings_;
};

}
