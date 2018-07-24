#include "beast_listener.hpp"
#include "beast_connection.hpp"
#include "log.hpp"

namespace msrv {

BeastListener::BeastListener(
    asio::io_context* context,
    const asio::ip::tcp::endpoint& endpoint,
    RequestEventListener* listener)
    : context_(context),
      acceptor_(*context),
      peerSocket_(*context),
      listener_(listener)
{
    acceptor_.open(endpoint.protocol());
    acceptor_.set_option(asio::socket_base::reuse_address(true));
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
        auto connection = std::make_shared<BeastConnection>(std::move(peerSocket_), listener_);
        connection->run();
    }

    if (!context_->stopped())
        accept();
}

}
