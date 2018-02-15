#pragma once

#include "defines.hpp"
#include "chrono.hpp"

#include <memory>

#include <boost/thread/future.hpp>

namespace msrv {

class WorkQueue;
class Server;
class Router;
class SettingsData;
class RequestFilterChain;

struct ServerConfig
{
    bool allowRemote;
    int port;
    const Router* router;
    const RequestFilterChain* filters;
    WorkQueue* defaultWorkQueue;
};

using ServerPtr = std::shared_ptr<Server>;
using ServerConfigPtr = std::unique_ptr<ServerConfig>;

class Server
{
public:
    static DurationMs pingEventPeriod() { return std::chrono::seconds(15); }
    static DurationMs eventDispatchDelay() { return DurationMs(20); }
    static ServerPtr create(ServerConfigPtr config);

    Server();
    virtual ~Server();

    virtual void run() = 0;
    virtual void exit() = 0;
    virtual void dispatchEvents() = 0;

    boost::unique_future<void> destroyed() { return destroyed_.get_future(); }

private:
    boost::promise<void> destroyed_;

    MSRV_NO_COPY_AND_ASSIGN(Server);
};


}
