#include "server.hpp"
#include "server_evhtp.hpp"

namespace msrv {

ServerPtr Server::createDefault(
    const Router *router,
    WorkQueue* defaultWorkQueue,
    ServerRestartCallback restartCallback)
{
    return ServerPtr(new server_evhtp::ServerImpl(
        router, defaultWorkQueue, std::move(restartCallback)));
}

}
