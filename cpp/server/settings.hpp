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

class SettingsData
{
public:
    SettingsData();
    ~SettingsData();

    int port = MSRV_DEFAULT_PORT;
    bool allowRemote = true;
    std::vector<std::string> musicDirs;
    std::vector<Path> musicDirsP;
    std::string webRoot;
    std::string clientConfigDir;
    Path clientConfigDirP;
    ApiPermissions permissions = ApiPermissions::ALL;

    bool authRequired = false;
    std::string authUser;
    std::string authPassword;
    std::unordered_map<std::string, std::string> responseHeaders;
    std::unordered_map<std::string, std::string> urlMappings;

    static void migrate(const char* appName, const Path& profileDir);
    static const Path& getDefaultWebRoot();

    void ensurePermissions(ApiPermissions p) const
    {
        if (!hasFlags(permissions, p))
            throw OperationForbiddenException();
    }

    bool isAllowedPath(const Path& path) const;
    void initialize(const Path& profileDir);

private:
    void loadFromJson(const Json& json);
    void loadFromFile(const Path& path);

    void loadPermissions(const Json& jsonRoot);
    void loadPermission(const Json& json, const char* name, ApiPermissions value);
};

using SettingsDataPtr = std::shared_ptr<const SettingsData>;

void to_json(Json& json, const ApiPermissions& permissions);

}
