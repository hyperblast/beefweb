#pragma once

#include "defines.hpp"
#include "content_type_map.hpp"
#include "player_api.hpp"
#include "player_events.hpp"
#include "server_thread.hpp"
#include "router.hpp"
#include "settings.hpp"
#include "work_queue.hpp"
#include "request_filter.hpp"

#include <memory>

namespace msrv {

class ServerHost : SettingsStore
{
public:
    ServerHost(Player* player);
    virtual ~ServerHost();

    void reconfigure(const SettingsData& settings);

private:
    virtual SettingsDataPtr settings() override;

    void handlePlayerEvent(PlayerEvent);
    void handleServerReady();

    Player* player_;
    EventDispatcher dispatcher_;
    Router router_;
    RequestFilterChain filters_;
    ThreadWorkQueue utilityQueue_;
    SettingsDataPtr currentSettings_;
    SettingsDataPtr nextSettings_;
    std::mutex settingsMutex_;
    ContentTypeMap ctmap_;
    std::unique_ptr<ServerThread> serverThread_;

    MSRV_NO_COPY_AND_ASSIGN(ServerHost);
};

}
