#include "beast_server.hpp"
#include "beast_listener.hpp"
#include "log.hpp"

namespace msrv {

namespace {

template<typename Address>
asio::ip::tcp::endpoint makeEndpoint(int port, bool allowRemote)
{
    return asio::ip::tcp::endpoint(
        allowRemote ? Address::any() : Address::loopback(),
        static_cast<unsigned short>(port));
}

}

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

bool BeastServer::startListener(const asio::ip::tcp::endpoint& endpoint)
{
    try
    {
        auto listener = std::make_shared<BeastListener>(
            &ioContext_, &connectionContext_, endpoint);

        logInfo(
            "listening on [%s]:%d",
            endpoint.address().to_string().c_str(),
            static_cast<int>(endpoint.port()));

        listener->run();
        return true;
    }
    catch (std::exception& ex)
    {
        logError(
            "failed to bind to address [%s]:%d: %s",
            endpoint.address().to_string().c_str(),
            static_cast<int>(endpoint.port()),
            ex.what());

        return false;
    }
}

void BeastServer::bind(int port, bool allowRemote)
{
    bool runningV4 = startListener(makeEndpoint<asio::ip::address_v4>(port, allowRemote));
    bool runningV6 = startListener(makeEndpoint<asio::ip::address_v6>(port, allowRemote));

    if (!runningV4 && !runningV6)
        throw std::runtime_error("failed to bind to any address");
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
