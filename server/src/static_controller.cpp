#include "static_controller.hpp"
#include "file_system.hpp"
#include "content_type_map.hpp"
#include "router.hpp"
#include "settings.hpp"

#include <boost/algorithm/string.hpp>

namespace msrv {

StaticController::StaticController(
    Request* request, SettingsStore* store, const ContentTypeMap* ctmap)
    : ControllerBase(request), store_(store), ctmap_(ctmap)
{
}

StaticController::~StaticController()
{
}

ResponsePtr StaticController::getFile()
{
    auto settings = store_->settings();
    const auto& rootDirUtf8 = settings->staticDir;

    if (rootDirUtf8.empty())
        return Response::error(HttpStatus::S_404_NOT_FOUND);

    std::string pathUtf8 = request()->path;

    if (!pathUtf8.empty() && pathUtf8.back() == '/')
        pathUtf8 += "index.html";

    auto rootDir = pathFromUtf8(rootDirUtf8).lexically_normal();
    auto fullPath = (rootDir / pathFromUtf8(pathUtf8)).lexically_normal();

    if (!isSubpath(rootDir.native(), fullPath.native()))
        return Response::error(HttpStatus::S_404_NOT_FOUND);

    return Response::file(fullPath, ctmap_->byFilePath(fullPath));
}

void StaticController::defineRoutes(
    Router* router,
    WorkQueue* workQueue,
    SettingsStore* store,
    const ContentTypeMap* ctmap)
{
    auto routes = router->defineRoutes<StaticController>();

    routes.createWith([=](Request* request)
    {
        return new StaticController(request, store, ctmap);
    });

    routes.useWorkQueue(workQueue);

    routes.get("", &StaticController::getFile);
    routes.get(":path*", &StaticController::getFile);
}

}
