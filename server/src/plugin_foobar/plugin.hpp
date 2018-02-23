#pragma once

#include "common.hpp"
#include "player.hpp"
#include "settings.hpp"
#include "../host.hpp"

namespace msrv {
namespace plugin_foobar {

class Plugin
{
public:
    static Plugin* current()
    {
        return current_;
    }

    Plugin();
    ~Plugin();

    void applySettings()
    {
        host_.reconfigure(getCurrentSettings());
    }

private:
    static Plugin* current_;

    PlayerImpl player_;
    Host host_;
};

}}
