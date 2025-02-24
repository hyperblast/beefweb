#include "outputs_controller.hpp"
#include "router.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"

namespace msrv {

OutputsController::OutputsController(Request* request, Player* player, SettingsDataPtr settings)
    : ControllerBase(request), player_(player), settings_(std::move(settings))
{
}

ResponsePtr OutputsController::getOutputs()
{
    auto outputs = player_->getOutputs();
    return Response::json({{"outputs", outputs}});
}

void OutputsController::setOutputDevice()
{
    settings_->ensurePermissions(ApiPermissions::CHANGE_OUTPUT);
    auto typeId = optionalParam<std::string>("typeId", {});
    auto deviceId = param<std::string>("deviceId");
    player_->setOutputDevice(typeId, deviceId);
}

void OutputsController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player, SettingsDataPtr settings)
{
    auto routes = router->defineRoutes<OutputsController>();
    routes.createWith([=](Request* r) { return new OutputsController(r, player, settings); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/outputs");
    routes.get("", &OutputsController::getOutputs);
    routes.post("active", &OutputsController::setOutputDevice);
}

}
