#pragma once

#include "defines.hpp"

#include <string>
#include <vector>

namespace msrv {

class SettingsData
{
public:
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

class SettingsStore
{
public:
    SettingsStore() = default;

    virtual const SettingsData& settings() const = 0;

    MSRV_NO_COPY_AND_ASSIGN(SettingsStore);
};

}
