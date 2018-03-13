#include "settings.hpp"
#include "file_system.hpp"
#include "project_info.hpp"

#include <boost/algorithm/string.hpp>

namespace msrv {

namespace {

bool isSubpath(const std::string& path, const std::string& childPath)
{
    return !path.empty()
        && boost::starts_with(childPath, path)
        && (childPath.length() == path.length()
            || childPath[path.length()] == static_cast<char>(Path::preferred_separator));
}

int dummySymbol;

}

std::string SettingsData::defaultStaticDir()
{
    auto modulePath = getModulePath(&dummySymbol);
    return pathToUtf8(modulePath.parent_path() / pathFromUtf8(MSRV_WEB_ROOT));
}

SettingsData::SettingsData()
    : port(MSRV_DEFAULT_PORT), allowRemote(true), authRequired(false)
{
}

SettingsData::~SettingsData()
{
}

bool SettingsData::isAllowedPath(const std::string& path) const
{
    for (auto& dir : musicDirs)
    {
        if (isSubpath(dir, path))
            return true;
    }

    return false;
}

}
