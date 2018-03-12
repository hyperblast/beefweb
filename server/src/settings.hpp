#pragma once

#include "defines.hpp"

#include <string>
#include <vector>
#include <memory>

namespace msrv {

class SettingsData
{
public:
    static std::string defaultStaticDir();

    SettingsData();
    ~SettingsData();

    int port;
    bool allowRemote;
    std::vector<std::string> musicDirs;
    std::string staticDir;

    bool authRequired;
    std::string authUser;
    std::string authPassword;

    bool isAllowedPath(const std::string& path) const;
};

using SettingsDataPtr = std::shared_ptr<const SettingsData>;

class SettingsStore
{
public:
    SettingsStore() = default;

    virtual SettingsDataPtr settings() = 0;

    MSRV_NO_COPY_AND_ASSIGN(SettingsStore);
};

}
