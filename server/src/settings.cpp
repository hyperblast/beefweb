#include "settings.hpp"
#include "project_info.hpp"
#include "json.hpp"

#include <stdexcept>
#include <boost/algorithm/string.hpp>

namespace msrv {

namespace {

int dummySymbol;

bool isSubpath(const std::string& path, const std::string& childPath)
{
    return !path.empty()
        && boost::starts_with(childPath, path)
        && (childPath.length() == path.length()
            || childPath[path.length()] == static_cast<char>(Path::preferred_separator));
}

inline Path thisModuleDir()
{
    return getModulePath(&dummySymbol).parent_path();
}

void parse(SettingsData* value, const Json& json)
{
    if (!json.is_object())
        throw std::invalid_argument("Expected json object");

    auto it = json.find("port");
    if (it != json.end())
        value->port = it->get<int>();

    it = json.find("allowRemote");
    if (it != json.end())
        value->allowRemote = it->get<bool>();

    it = json.find("musicDirs");
    if (it != json.end())
        value->musicDirs = it->get<std::vector<std::string>>();

    it = json.find("staticDir");
    if (it != json.end())
        value->staticDir = it->get<std::string>();

    it = json.find("authRequired");
    if (it != json.end())
        value->authRequired = it->get<bool>();

    it = json.find("authUser");
    if (it != json.end())
        value->authUser = it->get<std::string>();

    it = json.find("authPassword");
    if (it != json.end())
        value->authPassword = it->get<std::string>();
}

}

const Path& SettingsData::defaultConfigFile()
{
    static Path path = thisModuleDir() / pathFromUtf8(MSRV_CONFIG_FILE);
    return path;
}

const std::string& SettingsData::defaultStaticDir()
{
    static std::string path = pathToUtf8(thisModuleDir() / pathFromUtf8(MSRV_WEB_ROOT));
    return path;
}

SettingsData::SettingsData()
    : port(MSRV_DEFAULT_PORT), allowRemote(true), authRequired(false)
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

bool SettingsData::load(const Path& path)
{
    auto file = file_io::open(path);
    if (!file)
        return false;

    auto data = file_io::readToEnd(file.get());
    auto json = Json::parse(data);
    parse(this, json);
    return true;
}

}
