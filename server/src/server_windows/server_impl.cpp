#include "server_impl.hpp"
#include "../log.hpp"

namespace msrv {

ServerPtr Server::create(const ServerConfig* config)
{
    return std::make_shared<server_windows::ServerImpl>(config);
}

namespace server_windows {

ServerImpl::ServerImpl(const ServerConfig* config)
    : ioPort_(1),
      ioWorkQueue_(&ioPort_),
      eventLoop_(&ioPort_),
      http_(),
      config_(*config)
{
    http_.bindPrefix(getUrlPrefix(config));
}

ServerImpl::~ServerImpl()
{
}

std::wstring ServerImpl::getUrlPrefix(const ServerConfig* config)
{
    std::wostringstream prefix;
    prefix << L"http://localhost:" << config->port << L"/";
    return prefix.str();
}

void ServerImpl::run()
{
    http_.start();
    eventLoop_.run();
}

void ServerImpl::exit()
{
    eventLoop_.exit();
}

void ServerImpl::dispatchEvents()
{
}

}}
