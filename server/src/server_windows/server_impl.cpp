#include "server_impl.hpp"
#include "../log.hpp"

namespace msrv {

ServerPtr Server::create(const ServerConfig* config)
{
    return std::make_shared<server_windows::ServerImpl>(config);
}

namespace server_windows {

ServerImpl::ServerImpl(const ServerConfig* config)
    : ioPort_(1), ioWorkQueue_(&ioPort_), eventLoop_(&ioPort_), config_(*config)
{
}

ServerImpl::~ServerImpl()
{
}

void ServerImpl::run()
{
    eventLoop_.run();
}

void ServerImpl::exit()
{
    eventLoop_.exit();
}

void ServerImpl::dispatchEvents()
{
}

}

}
