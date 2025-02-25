#include "settings.hpp"
#include "json.hpp"
#include "log.hpp"

#include <stdexcept>

namespace msrv {

namespace {

struct PermissionDef
{
    ApiPermissions value;
    const char* id;

    operator bool() const
    {
        return id != nullptr;
    }
};

const PermissionDef permissionDefs[] = {
    {ApiPermissions::CHANGE_PLAYLISTS, "changePlaylists"},
    {ApiPermissions::CHANGE_OUTPUT, "changeOutput"},
    {ApiPermissions::CHANGE_CLIENT_CONFIG, "changeClientConfig"},
    {ApiPermissions::NONE, nullptr},
};

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

    for (int i = 0; permissionDefs[i]; i++)
        loadPermission(json, permissionDefs[i].id, permissionDefs[i].value);
}

void SettingsData::loadPermission(const Json& json, const char* name, ApiPermissions value)
{
    auto it = json.find(name);
    if (it == json.end())
        return;

    if (!it->is_boolean())
    {
        logError("failed to parse permission '%s': expected boolean value", name);
        return;
    }

    permissions = setFlags(permissions, value, it->get<bool>());
}

void to_json(Json& json, const ApiPermissions& value)
{
    for (int i = 0; permissionDefs[i]; i++)
        json[permissionDefs[i].id] = hasFlags(value, permissionDefs[i].value);
}

}
