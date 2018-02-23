#pragma once

#include "common.hpp"
#include "player.hpp"
#include "settings.hpp"
#include "work_queue.hpp"
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

    std::shared_ptr<WorkQueue> workQueue_;
    PlayerImpl player_;
    Host host_;

    MSRV_NO_COPY_AND_ASSIGN(Plugin);
};

}}
