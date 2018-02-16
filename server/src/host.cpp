#include "host.hpp"
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

Host::Host(Player* player)
    : player_(player)
{
    filters_.addFilter(std::make_unique<BasicAuthFilter>(static_cast<SettingsStore*>(this)));
    filters_.addFilter(std::make_unique<CompressionFilter>());
    filters_.addFilter(std::make_unique<CacheSupportFilter>());
    filters_.addFilter(std::make_unique<ExecuteHandlerFilter>());

    ctmap_.addDefaults();

    ArtworkController::defineRoutes(&router_, player_, this, &ctmap_);
    BrowserController::defineRoutes(&router_, this);
    StaticController::defineRoutes(&router_, this, &ctmap_);
    PlayerController::defineRoutes(&router_, player_);
    PlaylistsController::defineRoutes(&router_, player_, this);
    QueryController::defineRoutes(&router_, player_, &dispatcher_);

    player_->onEvent([this] (PlayerEvent event) { handlePlayerEvent(event); });

    serverThread_ = std::make_unique<ServerThread>([this] { handleServerReady(); });
}

Host::~Host()
{
    player_->onEvent(PlayerEventCallback());
}

SettingsDataPtr Host::settings()
{
    std::lock_guard<std::mutex> lock(settingsMutex_);
    return currentSettings_;
}

void Host::handlePlayerEvent(PlayerEvent event)
{
    dispatcher_.dispatch(event);
    serverThread_->dispatchEvents();
}

void Host::reconfigure(const SettingsData& settings)
{
    {
        std::lock_guard<std::mutex> lock(settingsMutex_);
        nextSettings_ = std::make_shared<SettingsData>(settings);
    }

    auto config = std::make_unique<ServerConfig>();

    config->allowRemote = settings.allowRemote;
    config->port = settings.port;
    config->defaultWorkQueue = &workQueue_;
    config->filters = &filters_;
    config->router = &router_;

    serverThread_->restart(std::move(config));
}

void Host::handleServerReady()
{
    std::lock_guard<std::mutex> lock(settingsMutex_);
    currentSettings_ = std::move(nextSettings_);
}

}
