#include "evhtp_server.hpp"

namespace msrv {

ServerCorePtr ServerCore::create()
{
    return std::make_unique<server_evhtp::EvhtpServer>();
}

namespace server_evhtp {

EvhtpServer::EvhtpServer()
    : eventBase_(),
      workQueue_(&eventBase_),
      timerFactory_(&eventBase_),
      host4_(&eventBase_),
      host6_(&eventBase_)
{
}

EvhtpServer::~EvhtpServer() = default;

void EvhtpServer::setEventListener(RequestEventListener*)
{
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
