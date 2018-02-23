#pragma once

#include "common.hpp"
#include "player.hpp"
#include "../host.hpp"

namespace msrv {
namespace plugin_foobar {

class Plugin
{
public:
    Plugin();
    ~Plugin();

private:
    PlayerImpl player_;
    Host host_;
};

}}
