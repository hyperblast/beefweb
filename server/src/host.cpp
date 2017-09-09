#include "host.hpp"
#include "artwork_controller.hpp"
#include "browser_controller.hpp"
#include "static_controller.hpp"
#include "player_controller.hpp"
#include "playlists_controller.hpp"
#include "query_controller.hpp"

namespace msrv {

Host::Host(Player* player)
    : player_(player)
{
    filters_.addFilter(RequestFilterPtr(new ExecuteHandlerFilter()));

    ctmap_.addDefaults();

    ArtworkController::defineRoutes(&router_, player_, this, &ctmap_);
    BrowserController::defineRoutes(&router_, this);
    StaticController::defineRoutes(&router_, this, &ctmap_);
    PlayerController::defineRoutes(&router_, player_);
    PlaylistsController::defineRoutes(&router_, player_, this);
    QueryController::defineRoutes(&router_, player_, &dispatcher_);

    server_ = Server::create(
        &router_,
        &filters_,
        &workQueue_,
        [this] (const SettingsData& settings) { handleServerRestart(settings); });

    player_->onEvent([this] (PlayerEvent event) { handlePlayerEvent(event); });
}

Host::~Host()
{
    player_->onEvent(PlayerEventCallback());
}

const SettingsData& Host::settings() const
{
    return settings_;
}

void Host::handlePlayerEvent(PlayerEvent event)
{
    dispatcher_.dispatch(event);
    server_->pollEventSources();
}

void Host::handleServerRestart(const SettingsData& settings)
{
    settings_ = settings;
}

void Host::reconfigure(const SettingsData& settings)
{
    server_->restart(settings);
}

}
