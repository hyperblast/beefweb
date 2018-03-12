#pragma once

#include "../defines.hpp"
#include "../settings.hpp"
#include "../server_host.hpp"
#include "../file_system.hpp"

#include "player.hpp"

namespace msrv {
namespace player_deadbeef {

class Plugin
{
public:
    Plugin();
    ~Plugin();

    void connect() { player_.connect(); }
    void disconnect() { player_.disconnect(); }
    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    bool reloadConfig();

    bool ready_;
    std::string staticDir_;
    SettingsData settings_;
    std::string musicDirList_;

    PlayerImpl player_;
    ServerHost host_;

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
    static Plugin* instance_;
    static const char configDialog_[];

    PluginWrapper();
    MSRV_NO_COPY_AND_ASSIGN(PluginWrapper);
};

}}
