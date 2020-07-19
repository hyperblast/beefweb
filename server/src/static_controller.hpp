#pragma once

#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Router;
class ContentTypeMap;
class WorkQueue;

class StaticController : public ControllerBase
{
public:
    StaticController(Request* request, SettingsDataPtr settings, const ContentTypeMap* ctmap);
    ~StaticController();

    ResponsePtr getFile();

    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        SettingsDataPtr settings,
        const ContentTypeMap* ctmap);

private:
    SettingsDataPtr settings_;
    const ContentTypeMap* ctmap_;
};


}
