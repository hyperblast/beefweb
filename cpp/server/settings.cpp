#include "settings.hpp"
#include "json.hpp"
#include "log.hpp"

#include <stdexcept>

namespace msrv {

namespace {

namespace permission_names {
constexpr char CHANGE_PLAYLISTS[] = "changePlaylists";
constexpr char CHANGE_OUTPUT[] = "changeOutput";
constexpr char CHANGE_CLIENT_CONFIG[] = "changeClientConfig";
}


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
    try
    {
        auto it = json.find(name);
        if (it != json.end())
            *value = it->get<T>();
    }
    catch (std::exception& ex)
    {
        logError("failed to parse property '%s': %s", name, ex.what());
    }
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

void SettingsData::loadFromFile(const Path& path)
{
    tryCatchLog([&] {
        auto file = file_io::open(path);
        if (!file)
            return;

        logInfo("loading config file: %s", pathToUtf8(path).c_str());
        auto data = file_io::readToEnd(file.get());
        loadFromJson(Json::parse(data));
    });
}

void SettingsData::loadFromJson(const Json& json)
{
    if (!json.is_object())
    {
        logError("invalid config: expected json object");
        return;
    }

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
    {
        logError("failed to parse property 'permissions': expected json object");
        return;
    }

    loadPermission(json, permission_names::CHANGE_PLAYLISTS, ApiPermissions::CHANGE_PLAYLISTS);
    loadPermission(json, permission_names::CHANGE_OUTPUT, ApiPermissions::CHANGE_OUTPUT);
    loadPermission(json, permission_names::CHANGE_CLIENT_CONFIG, ApiPermissions::CHANGE_CLIENT_CONFIG);
}

void SettingsData::loadPermission(const Json& json, const char* name, ApiPermissions value)
{
    try
    {
        auto it = json.find(name);
        if (it != json.end())
            permissions = setFlags(permissions, value, it->get<bool>());
    }
    catch (std::exception& ex)
    {
        logError("failed to parse permission '%s': %s", name, ex.what());
    }
}

void to_json(Json& json, const ApiPermissions& value)
{
    json[permission_names::CHANGE_PLAYLISTS] = hasFlags(value, ApiPermissions::CHANGE_PLAYLISTS);
    json[permission_names::CHANGE_OUTPUT] = hasFlags(value, ApiPermissions::CHANGE_OUTPUT);
    json[permission_names::CHANGE_CLIENT_CONFIG] = hasFlags(value, ApiPermissions::CHANGE_CLIENT_CONFIG);
}

}
