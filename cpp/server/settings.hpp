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
    std::vector<Path> musicPaths;
    std::string webRoot;

    bool authRequired;
    std::string authUser;
    std::string authPassword;
    std::unordered_map<std::string, std::string> responseHeaders;
    std::unordered_map<std::string, std::string> urlMappings;

    static const Path& getDefaultWebRoot();

    void initialize();
    bool isAllowedPath(const Path& path) const;

    void loadFromJson(const Json& json);
    bool loadFromFile(const Path& path);
    void loadAll(const char* appName);
};

using SettingsDataPtr = std::shared_ptr<const SettingsData>;

}
