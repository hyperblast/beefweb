#include "artwork_controller.hpp"
#include "file_system.hpp"
#include "settings.hpp"
#include "log.hpp"
#include "router.hpp"
#include "player_api.hpp"
#include "player_api_parsers.hpp"
#include "player_api_json.hpp"
#include "content_type_map.hpp"

namespace msrv {

ArtworkController::ArtworkController(Request* request, Player* player, ContentTypeMap* ctmap)
    : ControllerBase(request), player_(player), ctmap_(ctmap)
{
}

ArtworkController::~ArtworkController()
{
}

ResponsePtr ArtworkController::getArtwork()
{
    ArtworkQuery query;

    query.playlist = param<PlaylistRef>("plref");
    query.index = param<int32_t>("index");

    auto responseFuture = player_->fetchArtwork(query).then(
        boost::launch::sync, [this] (boost::unique_future<ArtworkResult> resultFuture)
        {
            auto result = resultFuture.get();

            if (result.path.empty())
                return ResponsePtr(Response::error(HttpStatus::S_404_NOT_FOUND, "no artwork found"));

            auto path = pathFromUtf8(result.path);
            return Response::file(std::move(path), ctmap_->get(path));
        });

    return Response::async(std::move(responseFuture));
}

void ArtworkController::defineRoutes(
    Router* router, Player* player, ContentTypeMap* ctmap)
{
    auto routes = router->defineRoutes<ArtworkController>();

    routes.createWith([=](Request* request)
    {
        return new ArtworkController(request, player, ctmap);
    });

    routes.useWorkQueue(player->workQueue());
    routes.setPrefix("api/artwork/:plref/:index");
    routes.get("", &ArtworkController::getArtwork);
}

}
