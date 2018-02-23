#include "browser_controller.hpp"
#include "settings.hpp"
#include "router.hpp"
#include "file_system.hpp"

namespace msrv {

namespace {

struct FileSystemEntry
{
    std::string name;
    std::string path;
    FileType type;
    ::int64_t size;
    ::int64_t timestamp;
};

FileSystemEntry makeFsEntry(const Path& name, const Path& path, const FileInfo& info)
{
    FileSystemEntry entry;
    entry.name = pathToUtf8(name);
    entry.path = pathToUtf8(path);
    entry.size = info.type == FileType::REGULAR ? info.size : -1;
    entry.type = info.type;
    entry.timestamp = info.timestamp;
    return entry;
}

const char* getTypeCode(FileType value)
{
    switch (value)
    {
    case FileType::REGULAR:
        return "F";

    case FileType::DIRECTORY:
        return "D";

    case FileType::UNKNOWN:
        return "U";

    default:
        abort();
    }
}

void to_json(Json& json, const FileSystemEntry& value)
{
    json["name"] = value.name;
    json["path"] = value.path;
    json["type"] = getTypeCode(value.type);
    json["timestamp"] = value.timestamp;
    json["size"] = value.size;
}

}

BrowserController::BrowserController(Request* request, SettingsStore* store)
    : ControllerBase(request), store_(store)
{
}

BrowserController::~BrowserController()
{
}

ResponsePtr BrowserController::getRoots()
{
    std::vector<FileSystemEntry> roots;
    auto settings = store_->settings();

    for (auto& dir : settings->musicDirs)
    {
        auto path = pathFromUtf8(dir);
        auto info = queryFileInfo(path);

        if (info.type == FileType::DIRECTORY)
            roots.emplace_back(makeFsEntry(path, path, info));
    }

    return Response::json({{ "roots", roots }});
}

ResponsePtr BrowserController::getEntries()
{
    auto requestedPath = param<std::string>("path");
    auto normalizedPath = pathFromUtf8(requestedPath).lexically_normal();
    auto settings = store_->settings();

    if (!settings->isAllowedPath(pathToUtf8(normalizedPath)))
        return Response::error(HttpStatus::S_403_FORBIDDEN);

    std::vector<FileSystemEntry> entries;

    for (auto iter = fs::directory_iterator(normalizedPath);
        iter != fs::directory_iterator();
        ++iter)
    {
        auto& path = iter->path();
        auto info = queryFileInfo(path);

        if (info.type != FileType::UNKNOWN)
            entries.emplace_back(makeFsEntry(path.filename(), path, info));
    }

    return  Response::json({{ "entries", entries }});
}

void BrowserController::defineRoutes(Router* router, WorkQueue* workQueue, SettingsStore* store)
{
    auto routes = router->defineRoutes<BrowserController>();

    routes.createWith([=](Request* request)
    {
        return new BrowserController(request, store);
    });

    routes.useWorkQueue(workQueue);

    routes.setPrefix("api/browser");

    routes.get("roots", &BrowserController::getRoots);
    routes.get("entries", &BrowserController::getEntries);
}

}
