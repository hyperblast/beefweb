#pragma once

#include "defines.hpp"
#include "project_info.hpp"
#include "core_types.hpp"
#include "file_system.hpp"
#include "json.hpp"

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>

namespace msrv {

enum class ApiPermissions : uint32_t
{
    NONE = 0,
    CHANGE_PLAYLISTS = 1,
    CHANGE_OUTPUT = 1 << 1,
    CHANGE_CLIENT_CONFIG = 1 << 2,
    ALL = static_cast<uint32_t>(-1)
};

MSRV_ENUM_FLAGS(ApiPermissions, uint32_t)

void to_json(Json& json, const ApiPermissions& permissions);

#ifndef MSRV_OS_MAC
void migrateSettings(const char* appName, const Path& profileDir);
#endif

class SettingsData
{
public:
    SettingsData() = default;
    ~SettingsData() = default;

    int port = MSRV_DEFAULT_PORT;
    bool allowRemote = true;
    std::vector<Path> musicDirs;
    bool authRequired = false;
    std::string authUser;
    std::string authPassword;
    ApiPermissions permissions = ApiPermissions::ALL;

    Path webRoot;
    Path altWebRoot;
    Path clientConfigDir;
    std::unordered_map<std::string, std::string> responseHeaders;
    std::unordered_map<std::string, Path> urlMappings;

    void ensurePermissions(ApiPermissions p) const
    {
        if (!hasFlags(permissions, p))
            throw OperationForbiddenException();
    }

    bool isAllowedPath(const Path& path) const;
};

using SettingsDataPtr = std::shared_ptr<const SettingsData>;

class SettingsBuilder
{
public:
    SettingsBuilder() = default;
    ~SettingsBuilder() = default;

    SettingsDataPtr build() const;

    Path profileDir;
    Path resourceDir;

    int port = MSRV_DEFAULT_PORT;
    bool allowRemote = true;
    std::vector<std::string> musicDirs;
    ApiPermissions permissions = ApiPermissions::ALL;

    bool authRequired = false;
    std::string authUser;
    std::string authPassword;
};

}
