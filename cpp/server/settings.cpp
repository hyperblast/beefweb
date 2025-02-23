#include "settings.hpp"
#include "json.hpp"
#include "log.hpp"
#include "core_types.hpp"

#include <stdexcept>

namespace msrv {

namespace {

int dummySymbol;

const Path& getBundleDir()
{
    static Path path = getModulePath(&dummySymbol).parent_path();
    return path;
}

const Path& getBundledConfigFile()
{
    static Path path = getBundleDir() / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE);
    return path;
}

template<typename T>
void loadValue(const Json& json, T* value, const char* name)
{
    auto it = json.find(name);
    if (it != json.end())
        *value = json.get<T>();
}

}

SettingsData::SettingsData()
    : webRoot(pathToUtf8(getDefaultWebRoot()))
{
}

SettingsData::~SettingsData() = default;

const Path& SettingsData::getDefaultWebRoot()
{
    static Path path = getBundleDir() / MSRV_PATH_LITERAL(MSRV_WEB_ROOT);
    return path;
}

Path SettingsData::getConfigDir(const char* appName)
{
    auto baseDir = getUserConfigDir();
    return baseDir.empty() ? Path() : baseDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID) / pathFromUtf8(appName);
}

Path SettingsData::getConfigFile(const char* appName)
{
    auto baseDir = getConfigDir(appName);
    return baseDir.empty() ? Path() : baseDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE);
}

void SettingsData::initialize()
{
    musicPaths.clear();
    musicPaths.reserve(musicDirs.size());

    for (const auto& dir : musicDirs)
        musicPaths.emplace_back(pathFromUtf8(dir).lexically_normal().make_preferred());

    musicDirs.clear();

    for (const auto& path : musicPaths)
        musicDirs.emplace_back(pathToUtf8(path));
}

bool SettingsData::isAllowedPath(const Path& path) const
{
    for (const auto& root : musicPaths)
    {
        if (isSubpath(root, path))
            return true;
    }

    return false;
}

void SettingsData::loadAll(const char* appName)
{
    loadFromFile(getBundledConfigFile());

    auto configPath = getConfigFile(appName);
    if (!configPath.empty())
        loadFromFile(configPath);

    configPath = getEnvAsPath(MSRV_CONFIG_FILE_ENV);
    if (!configPath.empty())
        loadFromFile(configPath);

    initialize();
}

bool SettingsData::loadFromFile(const Path& path)
{
    auto result = false;

    tryCatchLog([&] {
        auto file = file_io::open(path);
        if (!file)
            return;

        logInfo("loading config file: %s", pathToUtf8(path).c_str());
        auto data = file_io::readToEnd(file.get());
        loadFromJson(Json::parse(data));
        result = true;
    });

    return result;
}

void SettingsData::loadFromJson(const Json& json)
{
    if (!json.is_object())
        throw std::invalid_argument("Invalid config: expected json object");

    loadValue(json, &port, "port");
    loadValue(json, &allowRemote, "allowRemote");
    loadValue(json, &musicDirs, "musicDirs");
    loadValue(json, &webRoot, "webRoot");
    loadValue(json, &authRequired, "authRequired");
    loadValue(json, &authUser, "authUser");
    loadValue(json, &authPassword, "authPassword");
    loadValue(json, &responseHeaders, "responseHeaders");
    loadValue(json, &urlMappings, "urlMappings");
    loadPermissions(json);
}

void SettingsData::loadPermissions(const Json& jsonRoot)
{
    auto it = jsonRoot.find("permissions");
    if (it == jsonRoot.end())
        return;

    const Json& json = *it;

    if (!json.is_object())
        throw std::invalid_argument("permissions: expected object");

    loadPermission(json, permission_names::CHANGE_PLAYLISTS, ApiPermissions::CHANGE_PLAYLISTS);
    loadPermission(json, permission_names::CHANGE_OUTPUT, ApiPermissions::CHANGE_OUTPUT);
    loadPermission(json, permission_names::CHANGE_CLIENT_CONFIG, ApiPermissions::CHANGE_CLIENT_CONFIG);
}

void SettingsData::loadPermission(const Json& json, const char* name, ApiPermissions value)
{
    auto it = json.find(name);
    if (it != json.end())
        permissions = setFlags(permissions, value, it->get<bool>());
}

}
