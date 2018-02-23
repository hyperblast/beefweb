#include "artwork_controller.hpp"
#include "file_system.hpp"
#include "settings.hpp"
#include "log.hpp"
#include "router.hpp"
#include "player_api.hpp"
#include "content_type_map.hpp"

namespace msrv {

ArtworkController::ArtworkController(Request* request, Player* player, SettingsStore* store, ContentTypeMap* ctmap)
    : ControllerBase(request), player_(player), store_(store), ctmap_(ctmap)
{
}

ArtworkController::~ArtworkController()
{
}

ResponsePtr ArtworkController::getArtwork()
{
    ArtworkQuery query;

    if (auto path = optionalParam<std::string>("file"))
    {
        auto normalizedPath = pathToUtf8(pathFromUtf8(*path).lexically_normal());
        auto settings = store_->settings();

        if (!settings->isAllowedPath(normalizedPath))
            return Response::error(HttpStatus::S_403_FORBIDDEN);

        query.file = std::move(normalizedPath);
    }

    if (auto artist = optionalParam<std::string>("artist"))
        query.artist = std::move(*artist);

    if (auto album = optionalParam<std::string>("album"))
        query.album = std::move(*album);

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
    Router* router, Player* player, SettingsStore* store, ContentTypeMap* ctmap)
{
    auto routes = router->defineRoutes<ArtworkController>();

    routes.createWith([=](Request* request)
    {
        return new ArtworkController(request, player, store, ctmap);
    });

    routes.useWorkQueue(player->workQueue());
    routes.setPrefix("api/artwork");
    routes.get("", &ArtworkController::getArtwork);
}

}
