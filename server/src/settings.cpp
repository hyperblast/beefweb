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

    if (userConfigDir.empty()) {
        return Path();
    }

    return userConfigDir
        / pathFromUtf8(MSRV_PROJECT_ID)
        / pathFromUtf8(appName)
        / pathFromUtf8(MSRV_CONFIG_FILE);
}

const std::string& getDefaultStaticDir()
{
    static std::string path = pathToUtf8(getBundleDir() / pathFromUtf8(MSRV_WEB_ROOT));
    return path;
}

}

SettingsData::SettingsData()
    : port(MSRV_DEFAULT_PORT),
      allowRemote(true),
      staticDir(getDefaultStaticDir()),
      authRequired(false)
{
}

SettingsData::~SettingsData() = default;

bool SettingsData::isAllowedPath(const std::string& path) const
{
    for (auto& dir : musicDirs)
    {
        if (isSubpath(dir, path))
            return true;
    }

    return false;
}

void SettingsData::loadAll(const char* appName)
{
    load(getBundledConfigFile());

    auto userConfigPath = getUserConfigFile(appName);

    if (!userConfigPath.empty())
        load(userConfigPath);
}

bool SettingsData::load(const Path& path)
{
    auto result = false;

    tryCatchLog([&]{
        auto file = file_io::open(path);
        if (!file)
            return;

        logInfo("loading config file: %s", pathToUtf8(path).c_str());
        auto data = file_io::readToEnd(file.get());
        load(Json::parse(data));
        result = true;
    });

    return result;
}

void SettingsData::load(const Json& json)
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

    it = json.find("staticDir");
    if (it != json.end())
        staticDir = it->get<std::string>();

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
}

}
