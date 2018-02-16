#include "evhtp_server.hpp"

namespace msrv {

ServerCorePtr ServerCore::create()
{
    return std::make_unique<server_evhtp::EvhtpServer>();
}

namespace server_evhtp {

EvhtpServer::EvhtpServer()
    : eventBase_(),
      keepEventLoop_(&eventBase_, SocketHandle(), EV_PERSIST),
      workQueue_(&eventBase_),
      timerFactory_(&eventBase_),
      host4_(&eventBase_),
      host6_(&eventBase_)
{
    keepEventLoop_.schedule(std::chrono::minutes(1));
}

EvhtpServer::~EvhtpServer() = default;

void EvhtpServer::setEventListener(RequestEventListener* listener)
{
    host4_.setEventListener(listener);
    host6_.setEventListener(listener);
}

void EvhtpServer::bind(int port, bool allowRemote)
{
    constexpr int backlog = 64;

    host4_.bind(allowRemote ? "ipv4:0.0.0.0" : "ipv4:127.0.0.1", port, backlog);
    host6_.bind(allowRemote ? "ipv6:::0" : "ipv6:::1", port, backlog);

    if (!host4_.isBound() && !host6_.isBound())
        throw std::runtime_error("failed to bind to any address");
}

}}
