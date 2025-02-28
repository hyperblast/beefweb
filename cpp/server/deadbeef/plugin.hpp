#pragma once

#include "../defines.hpp"
#include "../settings.hpp"
#include "../server_host.hpp"
#include "../file_system.hpp"
#include "project_info.hpp"

#include "player.hpp"

namespace msrv {
namespace player_deadbeef {

class Plugin
{
public:
    Plugin();
    ~Plugin();

    void connect()
    {
        player_.connect();
    }

    void disconnect()
    {
        player_.disconnect();
    }

    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    static ApiPermissions getPermissionsFromConfig();

    static Path getProfileDir()
    {
        return {ddbApi->get_system_dir(DDB_SYS_DIR_CONFIG)};
    }

    void handleConfigChanged();
    void handlePluginsLoaded();
    bool refreshSettings();
    void reconfigure();

    PlayerImpl player_;
    ServerHost host_;
    bool pluginsLoaded_ = false;

    int port_ = MSRV_DEFAULT_PORT;
    bool allowRemote_ = true;
    std::string musicDirs_;
    bool authRequired_ = false;
    std::string authUser_;
    std::string authPassword_;
    ApiPermissions permissions_ = ApiPermissions::ALL;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

class PluginWrapper
{
public:
    static DB_plugin_t* load(DB_functions_t* api);

private:
    static void initDef();
    static int start();
    static int stop();
    static int connect();
    static int disconnect();
    static int handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

    static DB_misc_t definition_;
    static DeadbeefLogger* logger_;
    static Plugin* instance_;
    static const char configDialog_[];
    static char licenseText_[];

    MSRV_NO_COPY_AND_ASSIGN(PluginWrapper);
};

}
}
