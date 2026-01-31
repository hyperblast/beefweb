#include "static_controller.hpp"

#include <set>

#include "file_system.hpp"
#include "content_type_map.hpp"
#include "router.hpp"
#include "settings.hpp"
#include "log.hpp"

namespace msrv {

StaticController::StaticController(
    Request* request,
    PathVectorPtr targetDirs,
    const ContentTypeMap& contentTypes)
    : ControllerBase(request),
      targetDirs_(std::move(targetDirs)),
      contentTypes_(contentTypes)
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

    return path && !path->empty()
        ? isDirectory // subpath of target dir
            ? *path + "/index.html"
            : *path
        : isDirectory // exactly target dir
            ? std::string("index.html")
            : std::string();
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

    for (const auto& targetDir : *targetDirs_)
    {
        auto filePath = (targetDir / pathFromUtf8(requestPath)).lexically_normal();

        if (!isSubpath(targetDir, filePath))
            throw InvalidRequestException("invalid request path");

        auto handle = file_io::open(filePath);
        if (!handle)
            continue;

        auto info = file_io::queryInfo(handle.get());

        switch (info.type)
        {
        case FileType::REGULAR:
            return Response::file(
                std::move(filePath),
                std::move(handle),
                info,
                contentTypes_.byFilePath(filePath));

        case FileType::DIRECTORY:
            return redirectToDirectory();

        default:
            break;
        }
    }

    return Response::notFound();
}

void StaticController::defineRoutes(
    Router* router,
    WorkQueue* workQueue,
    SettingsDataPtr settings,
    const ContentTypeMap& contentTypes)
{
    for (auto& kv : settings->urlMappings)
    {
        auto dirs = std::make_shared<std::vector<Path>>(1, kv.second);
        defineRoutes(router, workQueue, kv.first, std::move(dirs), contentTypes);
    }

    if (settings->webRoot.empty() && settings->altWebRoot.empty())
        return;

    auto targetDirs = std::make_shared<std::vector<Path>>();

    if (!settings->webRoot.empty())
        targetDirs->emplace_back(settings->webRoot);

    if (!settings->altWebRoot.empty())
        targetDirs->emplace_back(settings->altWebRoot);

    defineRoutes(router, workQueue, "/", std::move(targetDirs), contentTypes);
}

void StaticController::defineRoutes(
    Router* router,
    WorkQueue* workQueue,
    const std::string& urlPrefix,
    PathVectorPtr targetDirs,
    const ContentTypeMap& contentTypes)
{
    assert(!targetDirs->empty());

    auto routes = router->defineRoutes<StaticController>();

    routes.createWith([=](Request* request) {
        return new StaticController(request, targetDirs, contentTypes);
    });

    routes.useWorkQueue(workQueue);

    routes.get(urlPrefix, &StaticController::getFile);
    routes.get(urlPrefix + ":path*", &StaticController::getFile);
}

}
