#pragma once

#include "defines.hpp"
#include "controller.hpp"

namespace msrv {

class Player;
class Router;
class SettingsStore;
class ContentTypeMap;

class ArtworkController : public ControllerBase
{
public:
    ArtworkController(Request* request, Player* player, ContentTypeMap* ctmap);
    ~ArtworkController();

    ResponsePtr getArtwork();

    static void defineRoutes(Router* router, Player* player, ContentTypeMap* ctmap);

private:
    Player* player_;
    ContentTypeMap* ctmap_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkController);
};

}
