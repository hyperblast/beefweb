#include <regex>

#include "client_config_controller.hpp"
#include "router.hpp"

namespace msrv {

ClientConfigController::ClientConfigController(Request* request, const char* appName)
    : ControllerBase(request), appName_(appName)
{
}

ResponsePtr ClientConfigController::getConfig()
{
    auto path = getFilePath();
    auto handle = file_io::open(path);

    if (!handle)
        return Response::json(Json());

    auto info = file_io::queryInfo(handle.get());
    return Response::file(std::move(path), std::move(handle), info, "application/json");
}

void ClientConfigController::setConfig()
{
    auto path = getFilePath();
    fs::create_directories(path.parent_path());
    auto data = request()->postData.dump(2);
    data.push_back('\n');
    file_io::write(path, data.data(), data.length());
}

void ClientConfigController::removeConfig()
{
    auto path = getFilePath();
    boost::system::error_code ec;
    fs::remove(path, ec);
}

Path ClientConfigController::getFilePath()
{
    static const std::regex idPattern("^[a-z0-9_]+$", std::regex::ECMAScript);

    auto id = param<std::string>("id");

    if (!std::regex_match(id, idPattern))
    {
        throw InvalidRequestException("Invalid id name");
    }

    auto configDir = SettingsData::getConfigDir(appName_);
    if (configDir.empty())
    {
        throw std::runtime_error("No config dir is available");
    }

    return configDir / MSRV_PATH_LITERAL("clientconfig") / pathFromUtf8(id + ".json");
}

void ClientConfigController::defineRoutes(Router* router, WorkQueue* workQueue, const char* appName)
{
    auto routes = router->defineRoutes<ClientConfigController>();
    routes.createWith([=](Request* r) { return new ClientConfigController(r, appName); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/clientconfig");
    routes.get(":id", &ClientConfigController::getConfig);
    routes.post(":id", &ClientConfigController::setConfig);
    routes.post("remove/:id", &ClientConfigController::removeConfig);
}

}
