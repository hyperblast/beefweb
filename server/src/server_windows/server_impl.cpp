#include "server_impl.hpp"
#include "../log.hpp"

namespace msrv {

ServerPtr Server::create(
    const Router*,
    const RequestFilterChain*,
    WorkQueue*,
    ServerRestartCallback)
{
    return ServerPtr(new server_windows::ServerImpl());
}

namespace server_windows {

ServerImpl::ServerImpl()
    : ioPort_(1), ioWorkQueue_(&ioPort_), eventLoop_(&ioPort_)
{
    thread_ = std::thread([this] { run(); });
}

ServerImpl::~ServerImpl()
{
    if (thread_.joinable())
    {
        eventLoop_.exit();
        thread_.join();
    }
}

void ServerImpl::run()
{
    tryCatchLog([this] { eventLoop_.run(); });
}

void ServerImpl::restart(const SettingsData&) { };
void ServerImpl::pollEventSources() { };

}

}
