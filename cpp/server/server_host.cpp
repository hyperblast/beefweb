#include "server_host.hpp"
#include "artwork_controller.hpp"
#include "browser_controller.hpp"
#include "static_controller.hpp"
#include "play_queue_controller.hpp"
#include "player_controller.hpp"
#include "playlists_controller.hpp"
#include "query_controller.hpp"
#include "cache_support_filter.hpp"
#include "compression_filter.hpp"
#include "basic_auth_filter.hpp"
#include "response_headers_filter.hpp"
#include "log.hpp"

namespace msrv {

ServerHost::ServerHost(Player* player)
    : player_(player)
{
    playerWorkQueue_ = player_->createWorkQueue();
    player_->onEvents([this](PlayerEvents event) { handlePlayerEvents(event); });
    serverThread_ = std::make_unique<ServerThread>();
}

ServerHost::~ServerHost()
{
    player_->onEvents(PlayerEventsCallback());
}

void ServerHost::handlePlayerEvents(PlayerEvents events)
{
    dispatcher_.dispatch(events);
    serverThread_->dispatchEvents();
}

void ServerHost::reconfigure(SettingsDataPtr settings)
{
    auto config = std::make_unique<ServerConfig>(settings->port, settings->allowRemote);

    auto router = &config->router;
    auto filters = &config->filters;

    if (settings->authRequired)
        filters->add(std::make_unique<BasicAuthFilter>(settings));

    filters->add(std::make_unique<CompressionFilter>());

    if (!settings->responseHeaders.empty())
        filters->add(std::make_unique<ResponseHeadersFilter>(settings));

    filters->add(std::make_unique<CacheSupportFilter>());
    filters->add(std::make_unique<ExecuteHandlerFilter>());

    PlayerController::defineRoutes(router, playerWorkQueue_.get(), player_);
    PlaylistsController::defineRoutes(router, playerWorkQueue_.get(), player_, settings);
    PlayQueueController::defineRoutes(router, playerWorkQueue_.get(), player_);
    QueryController::defineRoutes(router, playerWorkQueue_.get(), player_, &dispatcher_);
    ArtworkController::defineRoutes(router, playerWorkQueue_.get(), player_, contentTypes_);
    BrowserController::defineRoutes(router, &utilityQueue_, settings);
    StaticController::defineRoutes(router, &utilityQueue_, settings, contentTypes_);

    serverThread_->restart(std::move(config));
}

}
