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

namespace msrv {

ServerHost::ServerHost(Player* player)
    : player_(player)
{
    filters_.addFilter(std::make_unique<BasicAuthFilter>(static_cast<SettingsStore*>(this)));
    filters_.addFilter(std::make_unique<CompressionFilter>());
    filters_.addFilter(std::make_unique<CacheSupportFilter>());
    filters_.addFilter(std::make_unique<ExecuteHandlerFilter>());

    PlayerController::defineRoutes(&router_, player_);
    PlaylistsController::defineRoutes(&router_, player_, this);
    QueryController::defineRoutes(&router_, player_, &dispatcher_);
    ArtworkController::defineRoutes(&router_, player_, &ctmap_);

    BrowserController::defineRoutes(&router_, &utilityQueue_, this);
    StaticController::defineRoutes(&router_, &utilityQueue_, this, &ctmap_);

    player_->onEvent([this] (PlayerEvent event) { handlePlayerEvent(event); });

    serverThread_ = std::make_unique<ServerThread>([this] { handleServerReady(); });
}

ServerHost::~ServerHost()
{
    player_->onEvent(PlayerEventCallback());
}

SettingsDataPtr ServerHost::settings()
{
    std::lock_guard<std::mutex> lock(settingsMutex_);
    return currentSettings_;
}

void ServerHost::handlePlayerEvent(PlayerEvent event)
{
    dispatcher_.dispatch(event);
    serverThread_->dispatchEvents();
}

void ServerHost::reconfigure(const SettingsData& settings)
{
    {
        std::lock_guard<std::mutex> lock(settingsMutex_);
        nextSettings_ = std::make_shared<SettingsData>(settings);
    }

    auto config = std::make_unique<ServerConfig>();

    config->allowRemote = settings.allowRemote;
    config->port = settings.port;
    config->filters = &filters_;
    config->router = &router_;

    serverThread_->restart(std::move(config));
}

void ServerHost::handleServerReady()
{
    std::lock_guard<std::mutex> lock(settingsMutex_);
    currentSettings_ = std::move(nextSettings_);
}

}
