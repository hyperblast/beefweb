#pragma once

#include "defines.hpp"
#include "file_system.hpp"
#include "json.hpp"

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>

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
    std::unordered_map<std::string, std::string> responseHeaders;

    bool isAllowedPath(const std::string& path) const;

    void load(const Json& json);
    bool load(const Path& path);
    void loadAll();
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
