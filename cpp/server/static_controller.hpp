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
    StaticController(
        Request* request,
        PathVectorPtr targetDirs,
        const ContentTypeMap& contentTypes);
    ~StaticController();

    ResponsePtr getFile();

    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        SettingsDataPtr settings,
        const ContentTypeMap& contentTypes);

private:
    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        const std::string& urlPrefix,
        PathVectorPtr targetDirs,
        const ContentTypeMap& contentTypes);

    std::string getNormalizedPath();
    ResponsePtr redirectToDirectory();

    PathVectorPtr targetDirs_;
    const ContentTypeMap& contentTypes_;
};

}
