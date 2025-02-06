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
    return Response::file(path, std::move(handle), info, "application/json");
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
    static const std::regex scopePattern("^[a-z0-9_]+$", std::regex::ECMAScript);

    auto scope = param<std::string>("scope");

    if (!std::regex_match(scope, scopePattern))
    {
        throw InvalidRequestException("Invalid scope name");
    }

    auto configDir = SettingsData::getConfigDir(appName_);
    if (configDir.empty())
    {
        throw std::runtime_error("No config dir is available");
    }

    return configDir / MSRV_PATH_LITERAL("userconfig") / pathFromUtf8(scope + ".json");
}

void UserConfigController::defineRoutes(Router* router, WorkQueue* workQueue, const char* appName)
{
    auto routes = router->defineRoutes<UserConfigController>();
    routes.createWith([=](Request* r) { return new UserConfigController(r, appName); });
    routes.useWorkQueue(workQueue);
    routes.setPrefix("api/userconfig");
    routes.get(":scope", &UserConfigController::getConfig);
    routes.post(":scope", &UserConfigController::setConfig);
    routes.post(":scope/clear", &UserConfigController::clearConfig);
}

}
