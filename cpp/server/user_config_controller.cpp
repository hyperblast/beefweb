#include <regex>

#include "user_config_controller.hpp"
#include "router.hpp"

namespace msrv {

UserConfigController::UserConfigController(Request* request, const char* appName)
    : ControllerBase(request), appName_(appName)
{
}

ResponsePtr UserConfigController::getConfig()
{
    auto path = getFilePath();
    auto handle = file_io::open(path);

    if (!handle)
        return Response::json(Json());

    auto info = file_io::queryInfo(handle.get());
    return Response::file(std::move(path), std::move(handle), info, "application/json");
}

void UserConfigController::setConfig()
{
    auto path = getFilePath();
    fs::create_directories(path.parent_path());
    auto data = request()->postData.dump(2);
    data.push_back('\n');
    file_io::write(path, data.data(), data.length());
}

void UserConfigController::clearConfig()
{
    auto path = getFilePath();
    boost::system::error_code ec;
    fs::remove(path, ec);
}

Path UserConfigController::getFilePath()
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

    return configDir / MSRV_PATH_LITERAL("userconfig") / pathFromUtf8(id + ".json");
}

void UserConfigController::defineRoutes(Router* router, WorkQueue* workQueue, const char* appName)
{
    auto routes = router->defineRoutes<UserConfigController>();
    routes.createWith([=](Request* r) { return new UserConfigController(r, appName); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/userconfig");
    routes.get(":id", &UserConfigController::getConfig);
    routes.post(":id", &UserConfigController::setConfig);
    routes.post(":id/clear", &UserConfigController::clearConfig);
}

}
