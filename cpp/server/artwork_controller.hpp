#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "player_api.hpp"
#include "cache_support_filter.hpp"

namespace msrv {

class Player;
class Router;
class ContentTypeMap;

class ArtworkController : public ControllerBase
{
public:
    ArtworkController(Request* request, Player* player, const ContentTypeMap& contentTypes);
    ~ArtworkController();

    ResponsePtr getCurrentArtwork();
    ResponsePtr getArtwork();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player, const ContentTypeMap& contentTypes);

private:
    static ResponsePtr getNotFoundResponse();

    ResponsePtr getResponse(ArtworkResult* result);

    Player* player_;
    const ContentTypeMap& contentTypes_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkController);
};

}
