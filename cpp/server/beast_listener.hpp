#pragma once

#include "beast.hpp"
#include "server_core.hpp"

namespace msrv {

struct BeastConnectionContext;

class BeastListener : public std::enable_shared_from_this<BeastListener>
{
public:
    BeastListener(
        asio::io_context* ioContext,
        BeastConnectionContext* connectionContext,
        const asio::ip::tcp::endpoint& endpoint);

    ~BeastListener();

    void run();

private:
    void accept();
    void handleAccept(const boost::system::error_code& error);

    asio::io_context* ioContext_;
    BeastConnectionContext* connectionContext_;

    asio::ip::tcp::acceptor acceptor_;
    asio::ip::tcp::socket peerSocket_;
    asio::ip::tcp::endpoint peerEndpoint_;
};

}
