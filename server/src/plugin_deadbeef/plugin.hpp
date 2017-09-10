#pragma once

#include "../defines.hpp"
#include "../settings.hpp"
#include "../host.hpp"
#include "../file_system.hpp"

#include "player.hpp"

namespace msrv {
namespace plugin_deadbeef {

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

    SettingsData settings_;
    Path pluginDir;
    std::string musicDirs_;

    std::unique_ptr<PlayerImpl> player_;
    std::unique_ptr<Host> host_;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

}}
