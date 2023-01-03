#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "player_api.hpp"

namespace msrv {

class Player;
class Router;
class ContentTypeMap;

class ArtworkController : public ControllerBase
{
public:
    ArtworkController(Request* request, Player* player, const ContentTypeMap& contentTypes);
    ~ArtworkController();

    ResponsePtr getArtwork();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player, const ContentTypeMap& contentTypes);

private:
    ResponsePtr getResponse(ArtworkResult* result);
    ResponsePtr getNotFoundResponse();

    Player* player_;
    const ContentTypeMap& contentTypes_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkController);
};

}
