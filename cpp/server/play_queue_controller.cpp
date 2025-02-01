#include "play_queue_controller.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"
#include "router.hpp"

namespace msrv {

PlayQueueController::PlayQueueController(Request* request, Player* player)
    : ControllerBase(request), player_(player)
{
}

ResponsePtr PlayQueueController::getQueue()
{
    auto queue = player_->getPlayQueue();
    return Response::json({{"playQueue", queue}});
}

void PlayQueueController::addToQueue()
{
    player_->addToPlayQueue(
        param<PlaylistRef>("plref"),
        param<int32_t>("itemIndex"),
        optionalParam("queueIndex", -1));
}

void PlayQueueController::removeFromQueue()
{
    if (auto queueIndex = optionalParam<int32_t>("queueIndex"))
    {
        player_->removeFromPlayQueue(queueIndex.get());
        return;
    }

    auto plref = optionalParam<PlaylistRef>("plref");
    auto itemIndex = optionalParam<int32_t>("itemIndex");

    if (plref && itemIndex)
    {
        player_->removeFromPlayQueue(plref.get(), itemIndex.get());
        return;
    }

    throw InvalidRequestException("Either queueIndex or plref plus itemIndex parameters are required");
}

void PlayQueueController::clearQueue()
{
    player_->clearPlayQueue();
}

void PlayQueueController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player)
{
    auto routes = router->defineRoutes<PlayQueueController>();
    routes.createWith([=](Request* r) { return new PlayQueueController(r, player); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/playqueue");
    routes.get("", &PlayQueueController::getQueue);
    routes.post("add", &PlayQueueController::addToQueue);
    routes.post("remove", &PlayQueueController::removeFromQueue);
    routes.post("clear", &PlayQueueController::clearQueue);
}

}
