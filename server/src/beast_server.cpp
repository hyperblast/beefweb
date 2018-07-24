#include "beast_server.hpp"
#include "beast_listener.hpp"
#include "log.hpp"

namespace msrv {

ServerCorePtr ServerCore::createBeast()
{
    return std::make_unique<BeastServer>();
}

BeastServer::BeastServer()
    : ioContext_(),
      connectionContext_(),
      workQueue_(&ioContext_),
      timerFactory_(&ioContext_)
{
}

BeastServer::~BeastServer() = default;

void BeastServer::setEventListener(RequestEventListener* listener)
{
    connectionContext_.eventListener = listener;
};

std::shared_ptr<BeastListener> BeastServer::createListener(const asio::ip::tcp::endpoint& endpoint)
{
    try
    {
        auto listener = std::make_shared<BeastListener>(&ioContext_, &connectionContext_, endpoint);

        logInfo(
            "listening on [%s]:%d",
            endpoint.address().to_string().c_str(),
            static_cast<int>(endpoint.port()));

        return listener;
    }
    catch (std::exception& ex)
    {
        logError(
            "failed to bind to address [%s]:%d: %s",
            endpoint.address().to_string().c_str(),
            static_cast<int>(endpoint.port()),
            ex.what());

        return std::shared_ptr<BeastListener>();
    }
}

void BeastServer::bind(int port, bool allowRemote)
{
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
    ioContext_.run();
}

void BeastServer::exit()
{
    ioContext_.stop();
}

}
