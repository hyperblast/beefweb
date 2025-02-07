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

    default:
        return "O";
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

inline std::string pathSeparator()
{
    return std::string(1, static_cast<char>(Path::preferred_separator));
}

}

BrowserController::BrowserController(Request* request, SettingsDataPtr settings)
    : ControllerBase(request), settings_(settings)
{
}

BrowserController::~BrowserController() = default;

ResponsePtr BrowserController::getRoots()
{
    std::vector<FileSystemEntry> roots;

    for (auto& dir : settings_->musicDirs)
    {
        auto path = pathFromUtf8(dir);
        auto info = file_io::tryQueryInfo(path);

        if (info && info->type == FileType::DIRECTORY)
            roots.emplace_back(makeFsEntry(path, path, *info));
    }

    return Response::json({ {"roots", roots}, {"pathSeparator", pathSeparator()} });
}

ResponsePtr BrowserController::getEntries()
{
    auto requestedPath = param<std::string>("path");
    auto normalizedPath = pathFromUtf8(requestedPath).lexically_normal().make_preferred();

    if (!settings_->isAllowedPath(normalizedPath))
        return Response::error(HttpStatus::S_403_FORBIDDEN);

    std::vector<FileSystemEntry> entries;

    for (auto iter = fs::directory_iterator(normalizedPath);
         iter != fs::directory_iterator();
         ++iter)
    {
        auto& path = iter->path();
        auto info = file_io::tryQueryInfo(path);

        if (info && info->type != FileType::UNKNOWN)
            entries.emplace_back(makeFsEntry(path.filename(), path, *info));
    }

    return Response::json({ {"entries", entries}, {"pathSeparator", pathSeparator()} });
}

void BrowserController::defineRoutes(Router* router, WorkQueue* workQueue, SettingsDataPtr settings)
{
    auto routes = router->defineRoutes<BrowserController>();

    routes.createWith([=](Request* request) {
        return new BrowserController(request, settings);
    });

    routes.useWorkQueue(workQueue);

    routes.setPrefix("api/browser");

    routes.get("roots", &BrowserController::getRoots);
    routes.get("entries", &BrowserController::getEntries);
}

}
