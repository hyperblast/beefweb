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

ArtworkController::ArtworkController(Request* request, Player* player, const ContentTypeMap& contentTypes)
    : ControllerBase(request), player_(player), contentTypes_(contentTypes)
{
}

ArtworkController::~ArtworkController() = default;

ResponsePtr ArtworkController::getCurrentArtwork()
{
    auto responseFuture = player_->fetchCurrentArtwork().then(
        boost::launch::sync, [this](boost::unique_future<ArtworkResult> resultFuture) {
            auto result = resultFuture.get();
            return getResponse(&result);
        });

    return Response::async(std::move(responseFuture));
}

ResponsePtr ArtworkController::getArtwork()
{
    ArtworkQuery query;

    query.playlist = param<PlaylistRef>("plref");
    query.index = param<int32_t>("index");

    auto responseFuture = player_->fetchArtwork(query).then(
        boost::launch::sync, [this](boost::unique_future<ArtworkResult> resultFuture) {
            auto result = resultFuture.get();
            return getResponse(&result);
        });

    return Response::async(std::move(responseFuture));
}

ResponsePtr ArtworkController::getResponse(ArtworkResult* result)
{
    if (!result->filePath.empty())
    {
        auto filePath = pathFromUtf8(result->filePath);
        auto fileHandle = file_io::open(filePath);

        if (!fileHandle)
            return getNotFoundResponse();

        auto fileData = file_io::readToEnd(fileHandle.get(), 64);
        file_io::setPosition(fileHandle.get(), 0);

        auto fileInfo = file_io::queryInfo(fileHandle.get());

        auto response = Response::file(
            std::move(filePath),
            std::move(fileHandle),
            fileInfo,
            contentTypes_.byHeader(fileData));

        return response;
    }

    if (!result->fileData.empty())
    {
        const auto& contentType = contentTypes_.byHeader(result->fileData);
        return Response::data(std::move(result->fileData), contentType);
    }

    return getNotFoundResponse();
}

ResponsePtr ArtworkController::getNotFoundResponse()
{
    return Response::error(HttpStatus::S_404_NOT_FOUND, "no artwork found");
}

void ArtworkController::defineRoutes(
    Router* router, WorkQueue* workQueue, Player* player, const ContentTypeMap& contentTypes)
{
    auto routes = router->defineRoutes<ArtworkController>();

    routes.createWith([=](Request* request) {
        return new ArtworkController(request, player, contentTypes);
    });

    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/artwork");
    routes.get("current", &ArtworkController::getCurrentArtwork);
    routes.get(":plref/:index", &ArtworkController::getArtwork);
}

}
