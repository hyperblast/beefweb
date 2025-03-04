#include "static_controller.hpp"
#include "file_system.hpp"
#include "content_type_map.hpp"
#include "router.hpp"
#include "settings.hpp"
#include "log.hpp"

namespace msrv {

StaticController::StaticController(
    Request* request, const Path& targetDir, const ContentTypeMap& contentTypes)
    : ControllerBase(request), targetDir_(targetDir), contentTypes_(contentTypes)
{
}

StaticController::~StaticController() = default;

std::string StaticController::getNormalizedPath()
{
    const auto& fullPath = request()->path;

    if (fullPath.empty())
        throw InvalidRequestException("empty request path");

    auto isDirectory = fullPath.back() == '/';
    auto path = optionalParam<std::string>("path");

    if (!path || path->empty())
    {
        if (isDirectory)
            return "index.html";
        else
            return std::string();
    }
    else
    {
        if (isDirectory)
            return *path + "/index.html";
        else
            return *path;
    }
}

ResponsePtr StaticController::redirectToDirectory()
{
    return Response::temporaryRedirect(request()->path + "/");
}

ResponsePtr StaticController::getFile()
{
    auto requestPath = getNormalizedPath();
    if (requestPath.empty())
        return redirectToDirectory();

    auto filePath = (targetDir_ / pathFromUtf8(requestPath)).lexically_normal();

    if (!isSubpath(targetDir_, filePath))
        return Response::notFound();

    auto info = file_io::tryQueryInfo(filePath);
    if (!info)
        return Response::notFound();

    switch (info->type)
    {
    case FileType::REGULAR:
    {
        auto handle = file_io::open(filePath);
        if (!handle)
            return Response::notFound();

        const auto& contentType = contentTypes_.byFilePath(filePath);
        return Response::file(std::move(filePath), std::move(handle), *info, contentType);
    }

    case FileType::DIRECTORY:
        return redirectToDirectory();

    default:
        return Response::notFound();
    }
}

void StaticController::defineRoutes(
    Router* router,
    WorkQueue* workQueue,
    SettingsDataPtr settings,
    const ContentTypeMap& contentTypes)
{
    for (auto& kv : settings->urlMappings)
    {
        defineRoutes(router, workQueue, kv.first, kv.second, contentTypes);
    }

    if (!settings->webRoot.empty())
        defineRoutes(router, workQueue, "/", settings->webRoot, contentTypes);
}

void StaticController::defineRoutes(
    Router* router,
    WorkQueue* workQueue,
    const std::string& urlPrefix,
    const Path& targetDir,
    const ContentTypeMap& contentTypes)
{
    auto routes = router->defineRoutes<StaticController>();

    routes.createWith([=](Request* request) { return new StaticController(request, targetDir, contentTypes); });
    routes.useWorkQueue(workQueue);

    routes.get(urlPrefix, &StaticController::getFile);
    routes.get(urlPrefix + ":path*", &StaticController::getFile);
}

}
