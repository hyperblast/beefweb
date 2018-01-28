#include "server_impl.hpp"

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

ServerImpl::ServerImpl() = default;

ServerImpl::~ServerImpl() = default;
void ServerImpl::restart(const SettingsData&) { };
void ServerImpl::pollEventSources() { };

}}
