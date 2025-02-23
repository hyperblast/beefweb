#include "core_types_parsers.hpp"
#include "core_types_json.hpp"
#include "player_controller.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"
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

void to_json(Json& json, const ApiPermissions& value)
{
    json["allowChangePlaylists"] = hasFlags(value, ApiPermissions::CHANGE_PLAYLISTS);
    json["allowChangeOutput"] = hasFlags(value, ApiPermissions::CHANGE_OUTPUT);
    json["allowChangeClientConfig"] = hasFlags(value, ApiPermissions::CHANGE_CLIENT_CONFIG);
}

PlayerController::PlayerController(Request* request, Player* player, SettingsDataPtr settings)
    : ControllerBase(request), player_(player), settings_(std::move(settings))
{
}

ResponsePtr PlayerController::getState()
{
    ColumnsQueryPtr query;

    if (auto columns = optionalParam<std::vector<std::string>>("columns"))
        query = player_->createColumnsQuery(*columns);

    auto state = player_->queryPlayerState(query.get());

    Json stateJson(*state);
    stateJson["permissions"] = settings_->permissions;

    return Response::json({{"player", stateJson}});
}

void PlayerController::setState()
{
    if (auto volume = optionalParam<double>("volume"))
        player_->setVolumeAbsolute(*volume);

    if (auto volume = optionalParam<double>("relativeVolume"))
        player_->setVolumeRelative(*volume);

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
        boolOption->setValue(request.value.get<Switch>());
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

void PlayerController::playOrPause()
{
    player_->playOrPause();
}

void PlayerController::volumeUp()
{
    player_->volumeUp();
}

void PlayerController::volumeDown()
{
    player_->volumeDown();
}

void PlayerController::defineRoutes(
    Router* router, WorkQueue* workQueue, Player* player, SettingsDataPtr settings)
{
    auto routes = router->defineRoutes<PlayerController>();

    routes.createWith([=](Request* request) { return new PlayerController(request, player, settings); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/player");

    routes.get("", &PlayerController::getState);
    routes.post("", &PlayerController::setState);
    routes.post("play", &PlayerController::playCurrent);
    routes.post("play/random", &PlayerController::playRandom);
    routes.post("play/:plref/:index", &PlayerController::playItem);
    routes.post("play-pause", &PlayerController::playOrPause);
    routes.post("next", &PlayerController::playNext);
    routes.post("previous", &PlayerController::playPrevious);
    routes.post("stop", &PlayerController::stop);
    routes.post("pause", &PlayerController::pause);
    routes.post("pause/toggle", &PlayerController::togglePause);
    routes.post("volume/up", &PlayerController::volumeUp);
    routes.post("volume/down", &PlayerController::volumeDown);
}

}
