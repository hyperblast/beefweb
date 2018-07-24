#include "beast_server.hpp"
#include "beast_listener.hpp"
#include "log.hpp"

namespace msrv {

ServerCorePtr ServerCore::createBeast()
{
    return std::make_unique<BeastServer>();
}

BeastServer::BeastServer()
    : context_(),
      workQueue_(&context_),
      timerFactory_(&context_),
      listener_(nullptr)
{
}

BeastServer::~BeastServer() = default;

std::shared_ptr<BeastListener> BeastServer::createListener(const asio::ip::tcp::endpoint& endpoint)
{
    try
    {
        return std::make_shared<BeastListener>(&context_, endpoint, listener_);
    }
    catch (std::exception& ex)
    {
        logError(
            "failed to start listener on address %s port %d: %s",
            endpoint.address().to_string().c_str(),
            static_cast<int>(endpoint.port()),
            ex.what());

        return std::shared_ptr<BeastListener>();
    }
}

void BeastServer::bind(int port, bool allowRemote)
{
    assert(listener_ != nullptr);

    using namespace asio::ip;

    tcp::endpoint endpointV4(
        make_address(allowRemote ? "0.0.0.0" : "127.0.0.1"),
        static_cast<unsigned short>(port));

    tcp::endpoint endpointV6(
        make_address(allowRemote ? "::0" : "::1"),
        static_cast<unsigned short>(port));

    auto listenerV4 = createListener(endpointV4);
    auto listenerV6 = createListener(endpointV6);

    if (!listenerV4 && !listenerV6)
        throw std::runtime_error("failed to bind to any address");

    if (listenerV4)
        listenerV4->run();

    if (listenerV6)
        listenerV6->run();
}

void BeastServer::run()
{
    context_.run();
}

void BeastServer::exit()
{
    context_.stop();
}

}
