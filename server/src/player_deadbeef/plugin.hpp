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

    void connect();
    void disconnect();
    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    bool reloadConfig();

    bool ready_;
    Path pluginDir_;
    SettingsData settings_;
    std::string musicDirList_;

    PlayerImpl player_;
    ServerHost host_;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

}}
