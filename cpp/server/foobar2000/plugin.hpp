#pragma once

#include "common.hpp"
#include "player.hpp"
#include "utils.hpp"

#include "../settings.hpp"
#include "../server_host.hpp"

namespace msrv::player_foobar2000 {

class Plugin
{
public:
    static Plugin* current()
    {
        return current_;
    }

    Plugin();
    ~Plugin();

    void reconfigure();

    static Path getProfilePath();

private:
    static Plugin* current_;

    PlayerImpl player_;
    ServerHost host_;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

}
