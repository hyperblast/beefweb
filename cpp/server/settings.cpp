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

}

SettingsData::SettingsData() = default;
SettingsData::~SettingsData() = default;

#ifndef MSRV_OS_MAC
void SettingsData::migrate(const char* appName, const Path& profileDir)
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

bool SettingsData::isAllowedPath(const Path& path) const
{
    for (const auto& root : musicDirs)
    {
        if (isSubpath(root, path))
            return true;
    }

    return false;
}

void SettingsData::initialize(const Path& resourceDir, const Path& profileDir)
{
    assert(!resourceDir.empty());
    assert(!profileDir.empty());

    baseDir = profileDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID);

    loadFromFile(baseDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE));

    auto envConfigFile = getEnvAsPath(MSRV_CONFIG_FILE_ENV);
    if (!envConfigFile.empty())
    {
        if (envConfigFile.is_absolute())
            loadFromFile(envConfigFile);
        else
            logError("ignoring non-absolute config file path: %s", envConfigFile.c_str());
    }

    webRoot = resolvePath(pathFromUtf8(webRootOrig)).lexically_normal();

    if (webRoot.empty())
    {
        webRoot = resourceDir / MSRV_PATH_LITERAL(MSRV_WEBUI_ROOT);
    }

    clientConfigDir = resolvePath(pathFromUtf8(clientConfigDirOrig)).lexically_normal();

    if (clientConfigDir.empty())
    {
        clientConfigDir = baseDir / MSRV_PATH_LITERAL(MSRV_CLIENT_CONFIG_DIR);
    }

    musicDirs.clear();
    musicDirs.reserve(musicDirsOrig.size());

    auto index = 0;
    for (const auto& dir : musicDirsOrig)
    {
        if (dir.empty())
        {
            logError("skipping empty music directory at index %d", index);
            continue;
        }

        auto path = resolvePath(pathFromUtf8(dir)).lexically_normal();
        musicDirs.emplace_back(std::move(path));
        index++;
    }

    urlMappings.clear();
    urlMappings.reserve(urlMappingsOrig.size());

    for (const auto& kv : urlMappingsOrig)
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

        auto path = resolvePath(pathFromUtf8(kv.second)).lexically_normal();

        logInfo("using url mapping '%s' -> '%s'", kv.first.c_str(), kv.second.c_str());

        urlMappings[std::move(prefix)] = std::move(path);
    }
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
    loadValue(json, &musicDirsOrig, "musicDirs");
    loadValue(json, &webRootOrig, "webRoot");
    loadValue(json, &authRequired, "authRequired");
    loadValue(json, &authUser, "authUser");
    loadValue(json, &authPassword, "authPassword");
    loadValue(json, &responseHeaders, "responseHeaders");
    loadValue(json, &urlMappingsOrig, "urlMappings");
    loadValue(json, &clientConfigDirOrig, "clientConfigDir");
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
