#include <regex>

#include "client_config_controller.hpp"
#include "router.hpp"

namespace msrv {

ClientConfigController::ClientConfigController(Request* request, SettingsDataPtr settings)
    : ControllerBase(request), settings_(std::move(settings))
{
}

ResponsePtr ClientConfigController::getConfig()
{
    auto path = getFilePath();
    auto handle = file_io::open(path);

    if (!handle)
        return Response::json(Json());

    auto info = file_io::queryInfo(handle.get());
    return Response::file(std::move(path), std::move(handle), info, ContentType::APPLICATION_JSON);
}

void ClientConfigController::setConfig()
{
    checkPermissions();

    auto path = getFilePath();
    fs::create_directories(path.parent_path());
    auto data = request()->postData.dump(2);
    data.push_back('\n');
    file_io::write(path, data.data(), data.length());
}

void ClientConfigController::removeConfig()
{
    checkPermissions();

    auto path = getFilePath();
    boost::system::error_code ec;
    fs::remove(path, ec);
}

Path ClientConfigController::getFilePath()
{
    static const std::regex idPattern("^[a-z0-9_]{1,64}$", std::regex::ECMAScript);

    auto id = param<std::string>("id");

    if (!std::regex_match(id, idPattern))
    {
        throw InvalidRequestException("invalid configuration id: " + id);
    }

    return settings_->clientConfigDirP / pathFromUtf8(id + ".json");
}

void ClientConfigController::defineRoutes(Router* router, WorkQueue* workQueue, SettingsDataPtr settings)
{
    auto routes = router->defineRoutes<ClientConfigController>();

    routes.createWith([=](Request* r) { return new ClientConfigController(r, settings); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/clientconfig");

    routes.get(":id", &ClientConfigController::getConfig);
    routes.post(":id", &ClientConfigController::setConfig);
    routes.post("remove/:id", &ClientConfigController::removeConfig);
}

}
