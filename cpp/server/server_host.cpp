#include "server_host.hpp"
#include "artwork_controller.hpp"
#include "browser_controller.hpp"
#include "static_controller.hpp"
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
    player_->onEvent([this] (PlayerEvent event) { handlePlayerEvent(event); });
    serverThread_ = std::make_unique<ServerThread>();
}

ServerHost::~ServerHost()
{
    player_->onEvent(PlayerEventCallback());
}

void ServerHost::handlePlayerEvent(PlayerEvent event)
{
    dispatcher_.dispatch(event);
    serverThread_->dispatchEvents();
}


void ServerHost::reconfigure(SettingsDataPtr settings)
{
    auto config = std::make_unique<ServerConfig>(settings->port, settings->allowRemote);

    auto router = &config->router;
    auto filters = &config->filters;

    if (settings->authRequired)
        filters->addFilter(std::make_unique<BasicAuthFilter>(settings));

    filters->addFilter(std::make_unique<CompressionFilter>());

    if (!settings->responseHeaders.empty())
        filters->addFilter(std::make_unique<ResponseHeadersFilter>(settings));

    filters->addFilter(std::make_unique<CacheSupportFilter>());
    filters->addFilter(std::make_unique<ExecuteHandlerFilter>());

    PlayerController::defineRoutes(router, playerWorkQueue_.get(), player_);
    PlaylistsController::defineRoutes(router, playerWorkQueue_.get(), player_, settings);
    QueryController::defineRoutes(router, playerWorkQueue_.get(), player_, &dispatcher_);
    ArtworkController::defineRoutes(router, playerWorkQueue_.get(), player_, contentTypes_);
    BrowserController::defineRoutes(router, &utilityQueue_, settings);
    StaticController::defineRoutes(router, &utilityQueue_, settings, contentTypes_);

    serverThread_->restart(std::move(config));
}

}
