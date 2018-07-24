#include "beast_listener.hpp"
#include "log.hpp"

namespace msrv {

BeastListener::BeastListener(
    asio::io_context* context,
    const asio::ip::tcp::endpoint& endpoint,
    RequestEventListener* listener)
    : acceptor_(*context),
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
}

void BeastListener::accept()
{
    auto thisPtr = shared_from_this();

    acceptor_.async_accept(
        peerSocket_,
        [thisPtr] (const boost::system::error_code& error)
        {
            thisPtr->onAccept(error);
        });
}

void BeastListener::onAccept(const boost::system::error_code& error)
{
    if (error)
    {
        logError("%s", error.message().c_str());
    }
    else
    {
    }

    accept();
}

}
