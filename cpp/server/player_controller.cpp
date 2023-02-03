#include "core_types_parsers.hpp"
#include "core_types_json.hpp"
#include "player_controller.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"
#include "http.hpp"
#include "router.hpp"

namespace msrv {

struct SetOptionRequest
{
    std::string id;
    Json value;
};

void from_json(const Json& json, SetOptionRequest& request)
{
    request.id = json["id"];
    request.value = json["value"];
}

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

    if (auto playbackMode = optionalParam<int32_t>("playbackMode"))
    {
        if (auto option = player_->playbackModeOption())
        {
            auto newValue = *playbackMode;
            option->validate(newValue);
            option->setValue(newValue);
        }
    }

    if (auto options = optionalBodyParam<std::vector<SetOptionRequest>>("options"))
    {
        for (const auto& request : *options)
        {
            setOption(request);
        }
    }
}

void PlayerController::setOption(const SetOptionRequest& request)
{
    auto option = player_->getOption(request.id);

    if (auto boolOption = dynamic_cast<BoolPlayerOption*>(option))
    {
        boolOption->setValue(request.value.get<bool>());
    }
    else if (auto enumOption = dynamic_cast<EnumPlayerOption*>(option))
    {
        auto newValue = request.value.get<int32_t>();
        enumOption->validate(newValue);
        enumOption->setValue(newValue);
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
    if (auto by = optionalParam<std::string>("by"))
        player_->playNextBy(*by);
    else
        player_->playNext();
}

void PlayerController::playPrevious()
{
    if (auto by = optionalParam<std::string>("by"))
        player_->playPreviousBy(*by);
    else
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

void PlayerController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player)
{
    auto routes = router->defineRoutes<PlayerController>();

    routes.createWith([=](Request* request)
    {
        return new PlayerController(request, player);
    });

    routes.useWorkQueue(workQueue);

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
