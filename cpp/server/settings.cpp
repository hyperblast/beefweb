#include "settings.hpp"
#include "json.hpp"
#include "log.hpp"

#include <stdexcept>

#define MSRV_CONFIG_FILE        "config.json"
#define MSRV_CLIENT_CONFIG_DIR  "clientconfig"
#define MSRV_ALT_WEB_ROOT       "webroot"

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

Path resolvePath(const Path& baseDir, const Path& path)
{
    return path.empty() || path.is_absolute() ? path : (baseDir / path).lexically_normal();
}

std::vector<Path> resolveMusicDirs(const Path& baseDir, const std::vector<std::string>& musicDirs)
{
    std::vector<Path> result;
    result.reserve(musicDirs.size());

    auto index = 0;
    for (const auto& dir : musicDirs)
    {
        if (dir.empty())
        {
            logError("skipping empty music directory at index %d", index);
            continue;
        }

        result.emplace_back(resolvePath(baseDir, pathFromUtf8(dir)));
        index++;
    }

    return result;
}

Json readJsonFile(const Path& path)
{
    Json result;

    tryCatchLog([&] {
        auto file = file_io::open(path);
        if (!file)
            return;

        logInfo("loading config file: %s", pathToUtf8(path).c_str());
        auto data = file_io::readToEnd(file.get());
        result = Json::parse(data);
    });

    if (!result.is_null() && !result.is_object())
    {
        result = Json();
        logError("invalid config: expected json object");
    }

    return result;
}


template<typename T>
bool parseValue(const Json& json, const char* name, T* result)
{
    try
    {
        auto it = json.find(name);
        if (it == json.end())
            return false;
        *result = it->get<T>();
        return true;
    }
    catch (std::exception& ex)
    {
        logError("failed to parse property '%s': %s", name, ex.what());
        return false;
    }
}

void parsePath(const Json& json, const char* name, const Path& baseDir, Path* result)
{
    std::string webRoot;

    if (parseValue(json, name, &webRoot))
        *result = resolvePath(baseDir, webRoot);
}

void parseMusicDirs(const Json& json, const Path& baseDir, std::vector<Path>* result)
{
    std::vector<std::string> musicDirs;

    if (parseValue(json, "musicDirs", &musicDirs))
        *result = resolveMusicDirs(baseDir, musicDirs);
}

void parsePermission(const Json& json, const char* name, ApiPermissions value, ApiPermissions* result)
{
    auto it = json.find(name);
    if (it == json.end())
        return;

    if (!it->is_boolean())
    {
        logError("failed to parse permission '%s': expected boolean value", name);
        return;
    }

    *result = setFlags(*result, value, it->get<bool>());
}

void parsePermissions(const Json& jsonRoot, ApiPermissions* result)
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
        parsePermission(json, permissionDefs[i].id, permissionDefs[i].value, result);
}

void parseUrlMappings(const Json& json, const Path& baseDir, std::unordered_map<std::string, Path>* result)
{
    std::unordered_map<std::string, std::string> urlMappings;
    if (!parseValue(json, "urlMappings", &urlMappings))
        return;

    std::unordered_map<std::string, Path> urlMappingsResult;

    for (const auto& kv : urlMappings)
    {
        if (kv.first.find(':') != std::string::npos)
        {
            logError("url mapping '%s' contains reserved character ':'", kv.first.c_str());
            continue;
        }

        if (kv.first.empty() || kv.first == "/")
        {
            logError("root url mapping is not allowed, use 'webRoot' instead");
            continue;
        }

        if (kv.second.empty())
        {
            logError("url mapping '%s' has empty target", kv.first.c_str());
            continue;
        }

        std::string prefix(kv.first);

        if (prefix.front() != '/')
            prefix.insert(0, 1, '/');

        if (prefix.back() != '/')
            prefix.push_back('/');

        auto path = resolvePath(baseDir, pathFromUtf8(kv.second));

        logInfo("using url mapping '%s' -> '%s'", kv.first.c_str(), kv.second.c_str());

        urlMappingsResult[std::move(prefix)] = std::move(path);
    }

    *result = std::move(urlMappingsResult);
}

void processFile(const Path& baseDir, const Path& file, SettingsData* settings)
{
    const auto json = readJsonFile(file);

    parseValue(json, "port", &settings->port);
    parseValue(json, "allowRemote", &settings->allowRemote);
    parseValue(json, "authRequired", &settings->authRequired);
    parseValue(json, "authUser", &settings->authUser);
    parseValue(json, "authPassword", &settings->authPassword);
    parseValue(json, "responseHeaders", &settings->responseHeaders);
    parsePath(json, "webRoot", baseDir, &settings->webRoot);
    parsePath(json, "altWebRoot", baseDir, &settings->altWebRoot);
    parsePath(json, "clientConfigDir", baseDir, &settings->clientConfigDir);
    parseMusicDirs(json, baseDir, &settings->musicDirs);
    parseUrlMappings(json, baseDir, &settings->urlMappings);
    parsePermissions(json, &settings->permissions);
}

#ifndef MSRV_OS_MAC

void tryCopyFile(const Path& from, const Path& to)
{
    boost::system::error_code ec;

    if (fs::is_regular_file(from, ec) && !fs::exists(to, ec))
    {
        logInfo("migrating config file: %s -> %s", pathToUtf8(from).c_str(), pathToUtf8(to).c_str());

        fs::copy_file(from, to, ec);

        if (ec.failed())
            logError("copying failed: %s", ec.message().c_str());
    }
}

void tryCopyDirectory(const Path& from, const Path& to, const Path& ext)
{
    boost::system::error_code ec;

    if (!fs::is_directory(from, ec))
        return;

    for (auto& entry : fs::directory_iterator(from, ec))
    {
        if (entry.path().extension() == ext)
        {
            tryCopyFile(entry.path(), to / entry.path().filename());
        }
    }
}

#endif

}

void to_json(Json& json, const ApiPermissions& value)
{
    for (int i = 0; permissionDefs[i]; i++)
        json[permissionDefs[i].id] = hasFlags(value, permissionDefs[i].value);
}

bool SettingsData::isAllowedPath(const Path& path) const
{
    for (const auto& root : musicDirs)
    {
        if (isSubpath(root, path))
            return true;
    }

    return false;
}

SettingsDataPtr SettingsBuilder::build() const
{
    logDebug(
        "build settings: resourceDir = %s, profileDir = %s",
        pathToUtf8(resourceDir).c_str(),
        pathToUtf8(profileDir).c_str());

    assert(!resourceDir.empty());
    assert(!profileDir.empty());

    Path pluginProfileDir = getEnvAsPath(MSRV_PROFILE_DIR_ENV);

    if (!pluginProfileDir.empty())
    {
        if (pluginProfileDir.is_absolute())
        {
            logInfo("using custom profile dir: %s", pathToUtf8(pluginProfileDir).c_str());
        }
        else
        {
            logError("ignoring non-absolute profile dir: %s", pathToUtf8(pluginProfileDir).c_str());
            pluginProfileDir = Path();
        }
    }

    if (pluginProfileDir.empty())
        pluginProfileDir = profileDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID);

    auto settings = std::make_shared<SettingsData>();
    settings->port = port;
    settings->allowRemote = allowRemote;
    settings->permissions = permissions;
    settings->authRequired = authRequired;
    settings->authUser = authUser;
    settings->authPassword = authPassword;
    settings->webRoot = resourceDir / MSRV_PATH_LITERAL(MSRV_WEBUI_ROOT);
    settings->altWebRoot = pluginProfileDir / MSRV_PATH_LITERAL(MSRV_ALT_WEB_ROOT);
    settings->clientConfigDir = pluginProfileDir / MSRV_PATH_LITERAL(MSRV_CLIENT_CONFIG_DIR);
    settings->musicDirs = resolveMusicDirs(pluginProfileDir, musicDirs);

    processFile(pluginProfileDir, pluginProfileDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE), settings.get());
    return settings;
}

#ifndef MSRV_OS_MAC

void migrateSettings(const char* appName, const Path& profileDir)
{
    tryCatchLog([&] {
        boost::system::error_code ec;

        auto newConfigDir = profileDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID);
        auto newConfigFile = newConfigDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE);
        auto newClientConfigDir = newConfigDir / MSRV_PATH_LITERAL(MSRV_CLIENT_CONFIG_DIR);

        if (fs::exists(newClientConfigDir, ec))
            return;

        fs::create_directories(newClientConfigDir, ec);

        auto userConfigDir = getUserConfigDir();
        if (!userConfigDir.empty())
        {
            auto oldConfigDir = userConfigDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID) / pathFromUtf8(appName);
            auto oldConfigFile = oldConfigDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE_OLD);
            auto oldClientConfigDir = oldConfigDir / MSRV_PATH_LITERAL(MSRV_CLIENT_CONFIG_DIR);

            tryCopyFile(oldConfigFile, newConfigFile);
            tryCopyDirectory(oldClientConfigDir, newClientConfigDir, MSRV_PATH_LITERAL(".json"));
        }

        tryCopyFile(getThisModuleDir() / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE_OLD), newConfigFile);
    });
}

#endif

}
