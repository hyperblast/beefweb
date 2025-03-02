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
            logError("copying failed: %s", ec.what().c_str());
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

        tryCopyFile(getBundleDir() / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE_OLD), newConfigFile);
    });
}

const Path& SettingsData::getDefaultWebRoot()
{
    static Path path = getBundleDir() / MSRV_PATH_LITERAL(MSRV_WEBUI_ROOT);
    return path;
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

void SettingsData::initialize(const Path& profileDir)
{
    assert(!profileDir.empty());

    auto configDir = profileDir / MSRV_PATH_LITERAL(MSRV_PROJECT_ID);

    loadFromFile(configDir / MSRV_PATH_LITERAL(MSRV_CONFIG_FILE));

    auto envConfigFile = getEnvAsPath(MSRV_CONFIG_FILE_ENV);
    if (!envConfigFile.empty())
    {
        if (envConfigFile.is_absolute())
            loadFromFile(envConfigFile);
        else
            logError("ignoring non-absolute config file path: %s", envConfigFile.c_str());
    }

    if (webRoot.empty())
    {
        webRoot = pathToUtf8(getDefaultWebRoot());
    }

    clientConfigDir = pathFromUtf8(clientConfigDirStr).lexically_normal().make_preferred();

    if (!clientConfigDir.empty() && !clientConfigDir.is_absolute())
    {
        logError("ignoring non-absolute client config dir: %s", clientConfigDirStr.c_str());
        clientConfigDir.clear();
    }

    if (clientConfigDir.empty())
    {
        clientConfigDir = configDir / MSRV_PATH_LITERAL(MSRV_CLIENT_CONFIG_DIR);
    }

    musicDirs.clear();
    musicDirs.reserve(musicDirsStr.size());

    for (const auto& dir : musicDirsStr)
    {
        auto path = pathFromUtf8(dir).lexically_normal().make_preferred();

        if (!path.is_absolute())
        {
            logError("ignoring non-absolute music dir: %s", dir.c_str());
            continue;
        }

        musicDirs.emplace_back(std::move(path));
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
    loadValue(json, &musicDirsStr, "musicDirs");
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
