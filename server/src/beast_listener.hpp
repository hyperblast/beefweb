#pragma once

#include "beast.hpp"
#include "server_core.hpp"

namespace msrv {

class BeastListener : public std::enable_shared_from_this<BeastListener>
{
public:
    BeastListener(
        asio::io_context* context,
        const asio::ip::tcp::endpoint& endpoint,
        RequestEventListener* listener);

    ~BeastListener();

    void run();

private:
    void accept();
    void handleAccept(const boost::system::error_code& error);

    asio::io_context* context_;
    asio::ip::tcp::acceptor acceptor_;
    asio::ip::tcp::socket peerSocket_;
    asio::ip::tcp::endpoint peerEndpoint_;
    RequestEventListener* listener_;
};

}
