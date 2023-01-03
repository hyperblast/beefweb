#include "beast_listener.hpp"
#include "beast_connection.hpp"
#include "log.hpp"

namespace msrv {

BeastListener::BeastListener(
    asio::io_context* ioContext,
    BeastConnectionContext* connectionContext,
    const asio::ip::tcp::endpoint& endpoint)
    : ioContext_(ioContext),
      connectionContext_(connectionContext),
      acceptor_(*ioContext),
      peerSocket_(*ioContext)
{
    acceptor_.open(endpoint.protocol());

    acceptor_.set_option(asio::socket_base::reuse_address(true));

    if (endpoint.protocol() == asio::ip::tcp::v6())
        acceptor_.set_option(asio::ip::v6_only(true));

    acceptor_.bind(endpoint);
    acceptor_.listen(asio::socket_base::max_listen_connections);
}

BeastListener::~BeastListener() = default;

void BeastListener::run()
{
    accept();
}

void BeastListener::accept()
{
    auto thisPtr = shared_from_this();

    acceptor_.async_accept(
        peerSocket_,
        [thisPtr] (const boost::system::error_code& error)
        {
            thisPtr->handleAccept(error);
        });
}

void BeastListener::handleAccept(const boost::system::error_code& error)
{
    if (error)
    {
        logError("handleAccept: %s", error.message().c_str());
    }
    else
    {
        auto connection = std::make_shared<BeastConnection>(connectionContext_, std::move(peerSocket_));
        connection->run();
    }

    if (!ioContext_->stopped())
        accept();
}

}
