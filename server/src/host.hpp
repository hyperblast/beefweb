#pragma once

#include "defines.hpp"
#include "content_type_map.hpp"
#include "player_api.hpp"
#include "player_events.hpp"
#include "server.hpp"
#include "router.hpp"
#include "settings.hpp"
#include "work_queue.hpp"
#include "request_filter.hpp"

namespace msrv {

class Host : SettingsStore
{
public:
    Host(Player* player);
    virtual ~Host();

    void reconfigure(const SettingsData& settings);

private:
    virtual const SettingsData& settings() const override;

    void handlePlayerEvent(PlayerEvent);
    void handleServerRestart(const SettingsData&);

    Player* player_;
    EventDispatcher dispatcher_;
    Router router_;
    RequestFilterChain filters_;
    ImmediateWorkQueue workQueue_;
    ServerPtr server_;
    SettingsData settings_;
    ContentTypeMap ctmap_;

    MSRV_NO_COPY_AND_ASSIGN(Host);
};

}
