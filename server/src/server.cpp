#include "server.hpp"
#include "server_evhtp.hpp"

namespace msrv {

Server::Server() = default;
Server::~Server() = default;

ServerPtr Server::create(
    const Router *router,
    const RequestFilterChain* filters,
    WorkQueue* defaultWorkQueue,
    ServerRestartCallback restartCallback)
{
    return ServerPtr(new server_evhtp::ServerImpl(
        router, filters, defaultWorkQueue, std::move(restartCallback)));
}

}
