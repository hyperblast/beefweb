#pragma once

#include "controller.hpp"

namespace msrv {

class Router;
class SettingsStore;
class ContentTypeMap;
class WorkQueue;

class StaticController : public ControllerBase
{
public:
    StaticController(Request* request, SettingsStore* store, const ContentTypeMap* ctmap);
    ~StaticController();

    ResponsePtr getFile();

    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        SettingsStore* store,
        const ContentTypeMap* ctmap);

private:
    SettingsStore* store_;
    const ContentTypeMap* ctmap_;
};


}
