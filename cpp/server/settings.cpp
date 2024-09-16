#include "settings.hpp"
#include "project_info.hpp"
#include "json.hpp"
#include "log.hpp"

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
    static Path path = getBundleDir() / pathFromUtf8(MSRV_CONFIG_FILE);
    return path;
}

Path getUserConfigFile(const char* appName)
{
    auto userConfigDir = getUserConfigDir();

    if (userConfigDir.empty())
    {
        return Path();
    }

    return userConfigDir
        / pathFromUtf8(MSRV_PROJECT_ID)
        / pathFromUtf8(appName)
        / pathFromUtf8(MSRV_CONFIG_FILE);
}

const std::string& getDefaultWebRoot()
{
    static std::string path = pathToUtf8(getBundleDir() / pathFromUtf8(MSRV_WEB_ROOT));
    return path;
}

}

SettingsData::SettingsData()
    : port(MSRV_DEFAULT_PORT),
      allowRemote(true),
      webRoot(getDefaultWebRoot()),
      authRequired(false)
{
}

SettingsData::~SettingsData() = default;

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

    auto configPath = getUserConfigFile(appName);
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
        throw std::invalid_argument("Expected json object");

    auto it = json.find("port");
    if (it != json.end())
        port = it->get<int>();

    it = json.find("allowRemote");
    if (it != json.end())
        allowRemote = it->get<bool>();

    it = json.find("musicDirs");
    if (it != json.end())
        musicDirs = it->get<std::vector<std::string>>();

    it = json.find("webRoot");
    if (it != json.end())
        webRoot = it->get<std::string>();

    it = json.find("authRequired");
    if (it != json.end())
        authRequired = it->get<bool>();

    it = json.find("authUser");
    if (it != json.end())
        authUser = it->get<std::string>();

    it = json.find("authPassword");
    if (it != json.end())
        authPassword = it->get<std::string>();

    it = json.find("responseHeaders");
    if (it != json.end())
        responseHeaders = it->get<std::unordered_map<std::string, std::string>>();

    it = json.find("urlMappings");
    if (it != json.end())
        urlMappings = it->get<std::unordered_map<std::string, std::string>>();
}

}
