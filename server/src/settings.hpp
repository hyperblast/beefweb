#pragma once

#include "defines.hpp"
#include "file_system.hpp"

#include <string>
#include <vector>
#include <memory>

namespace msrv {

class SettingsData
{
public:
    static const std::string& defaultStaticDir();
    static const Path& defaultConfigFile();

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

    bool load(const Path& path);
    bool load() { return load(defaultConfigFile()); }
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
