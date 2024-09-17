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
        const Path& targetDir,
        const ContentTypeMap& contentTypes);
    ~StaticController();

    ResponsePtr getFile();

    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        SettingsDataPtr settings,
        const ContentTypeMap& contentTypes);

    static void defineRoutes(
        Router* router,
        WorkQueue* workQueue,
        const std::string& urlPrefix,
        const std::string& targetDir,
        const ContentTypeMap& contentTypes);

private:
    std::string getNormalizedPath();
    ResponsePtr redirectToDirectory();

    const Path& targetDir_;
    const ContentTypeMap& contentTypes_;
};

}
