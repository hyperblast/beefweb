#pragma once

#include "defines.hpp"
#include "controller.hpp"

namespace msrv {

class Player;
class Router;
struct SetOptionRequest;

class PlayerController : public ControllerBase
{
public:
    PlayerController(Request* request, Player* player);

    ResponsePtr getState();
    void setState();

    void playItem();
    void playCurrent();
    void playNext();
    void playPrevious();
    void playRandom();
    void stop();
    void pause();
    void togglePause();

    void setOption(const SetOptionRequest& request);

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player);

private:
    Player* player_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerController);
};

}
