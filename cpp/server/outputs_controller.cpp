#include "outputs_controller.hpp"
#include "router.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"

namespace msrv {

OutputsController::OutputsController(Request* request, Player* player)
    : ControllerBase(request), player_(player)
{
}

ResponsePtr OutputsController::getAll()
{
    auto outputs = player_->getOutputs();
    return Response::json({{"outputs", outputs}});
}

void OutputsController::setActive()
{
    auto typeId = param<std::string>("typeId");
    auto outputId = param<std::string>("outputId");
    player_->setActiveOutput(typeId, outputId);
}

void OutputsController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player)
{
    auto routes = router->defineRoutes<OutputsController>();
    routes.createWith([=](Request* r) { return new OutputsController(r, player); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/outputs");
    routes.get("", &OutputsController::getAll);
    routes.post("active", &OutputsController::setActive);
}

}