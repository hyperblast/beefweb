#include "settings.hpp"

#include <boost/algorithm/string.hpp>

namespace msrv {

namespace {

bool isSubpath(const std::string& path, const std::string& childPath)
{
    return !path.empty()
        && boost::starts_with(childPath, path)
        && (childPath.length() == path.length() || childPath[path.length()] == '/');
}

}

SettingsData::SettingsData()
    : port(0), allowRemote(false)
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
