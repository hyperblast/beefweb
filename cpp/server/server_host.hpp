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

class ServerHost
{
public:
    explicit ServerHost(Player* player);
    virtual ~ServerHost();

    void reconfigure(SettingsDataPtr settings);

private:
    void handlePlayerEvents(PlayerEvents events);

    Player* player_;

    EventDispatcher dispatcher_;
    ContentTypeMap contentTypes_;

    std::unique_ptr<WorkQueue> playerWorkQueue_;
    ThreadPoolWorkQueue utilityQueue_;
    std::unique_ptr<ServerThread> serverThread_;

    MSRV_NO_COPY_AND_ASSIGN(ServerHost);
};

}
