#pragma once

#include "defines.hpp"

#include <functional>
#include <memory>

namespace msrv {

class WorkQueue;
class Server;
class Router;
class SettingsData;

using ServerPtr = std::unique_ptr<Server>;
using ServerRestartCallback = std::function<void(const SettingsData&)>;

class Server
{
public:
    Server() = default;
    virtual ~Server() = default;

    static ServerPtr createDefault(
        const Router* router,
        WorkQueue* defaultWorkQueue,
        ServerRestartCallback restartCallback);

    virtual void restart(const SettingsData& settings) = 0;
    virtual void pollEventSources() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(Server);
};

}
