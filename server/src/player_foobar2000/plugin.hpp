#pragma once

#include "common.hpp"
#include "player.hpp"
#include "settings.hpp"
#include "utils.hpp"
#include "../server_host.hpp"

namespace msrv {
namespace player_foobar2000 {

class Plugin
{
public:
    static Plugin* current()
    {
        return current_;
    }

    Plugin();
    ~Plugin();

    void reconfigure()
    {
        host_.reconfigure(getCurrentSettings());
    }

private:
    static Plugin* current_;

    PlayerImpl player_;
    ServerHost host_;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

}}
