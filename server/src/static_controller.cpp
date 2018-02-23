#include "static_controller.hpp"
#include "file_system.hpp"
#include "content_type_map.hpp"
#include "router.hpp"
#include "settings.hpp"

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
    const auto& staticDir = settings->staticDir;

    if (staticDir.empty())
        return Response::error(HttpStatus::S_404_NOT_FOUND);

    std::string path = request()->path;

    if (!path.empty() && path.back() == '/')
        path += "index.html";

    auto filePath = pathFromUtf8(staticDir) / pathFromUtf8(path);
    return Response::file(filePath, ctmap_->get(filePath));
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
