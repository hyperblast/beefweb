#include "core_types_parsers.hpp"
#include "core_types_json.hpp"
#include "player_controller.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"
#include "http.hpp"
#include "router.hpp"

namespace msrv {

PlayerController::PlayerController(Request* request, Player* player)
    : ControllerBase(request), player_(player) { }

ResponsePtr PlayerController::getState()
{
    TrackQueryPtr query;

    if (auto columns = optionalParam<std::vector<std::string>>("columns"))
        query = player_->createTrackQuery(*columns);

    auto state = player_->queryPlayerState(query.get());

    return Response::json({{ "player", *state }});
}

void PlayerController::setState()
{
    if (auto volume = optionalParam<double>("volume"))
        player_->setVolume(*volume);

    if (auto isMuted = optionalParam<Switch>("isMuted"))
        player_->setMuted(*isMuted);

    if (auto position = optionalParam<double>("position"))
        player_->seekAbsolute(*position);

    if (auto relativePosition = optionalParam<double>("relativePosition"))
        player_->seekRelative(*relativePosition);

    for (auto option : player_->options())
    {
        if (auto value = optionalParam<std::string>(option->name()))
            option->set(*value);
    }
}

void PlayerController::playItem()
{
    player_->playItem(
        param<PlaylistRef>("plref"),
        param<int32_t>("index"));
}

void PlayerController::playCurrent()
{
    player_->playCurrent();
}

void PlayerController::playNext()
{
    player_->playNext();
}

void PlayerController::playPrevious()
{
    player_->playPrevious();
}

void PlayerController::playRandom()
{
    player_->playRandom();
}

void PlayerController::stop()
{
    player_->stop();
}

void PlayerController::pause()
{
    player_->pause();
}

void PlayerController::togglePause()
{
    player_->togglePause();
}

void PlayerController::defineRoutes(Router* router, Player* player)
{
    auto routes = router->defineRoutes<PlayerController>();

    routes.createWith([=](Request* request)
    {
        return new PlayerController(request, player);
    });

    routes.useWorkQueue(player->workQueue());

    routes.setPrefix("api/player");

    routes.get("", &PlayerController::getState);
    routes.post("", &PlayerController::setState);
    routes.post("play", &PlayerController::playCurrent);
    routes.post("play/random", &PlayerController::playRandom);
    routes.post("play/:plref/:index", &PlayerController::playItem);
    routes.post("next", &PlayerController::playNext);
    routes.post("previous", &PlayerController::playPrevious);
    routes.post("stop", &PlayerController::stop);
    routes.post("pause", &PlayerController::pause);
    routes.post("pause/toggle", &PlayerController::togglePause);
}

}
