#include "beast_connection.hpp"
#include "log.hpp"

namespace msrv {

BeastConnection::BeastConnection(
    asio::ip::tcp::socket socket,
    RequestEventListener* listener)
    : socket_(std::move(socket)),
      listener_(listener)
{
}

BeastConnection::~BeastConnection() = default;

void BeastConnection::run()
{
    readRequest();
}

void BeastConnection::abort()
{
    handleWriteResponse(boost::system::error_code(), true);
}

void BeastConnection::closeSocket()
{
    boost::system::error_code error;

    socket_.shutdown(asio::ip::tcp::socket::shutdown_send, error);

    if (error)
        logError("closeSocket: %s", error.message().c_str());
}

void BeastConnection::readRequest()
{
    request_ = {};

    auto thisPtr = shared_from_this();

    beast::http::async_read(
        socket_,
        buffer_,
        request_,
        [thisPtr] (const boost::system::error_code& error, size_t)
        {
            thisPtr->handleReadRequest(error);
        });
}

void BeastConnection::handleReadRequest(const boost::system::error_code& error)
{
    if (error == beast::http::error::end_of_stream)
    {
        closeSocket();
        return;
    }

    if (error)
    {
        logError("handleReadRequest: %s", error.message().c_str());
        return;
    }

    coreReq_ = std::make_unique<BeastRequest>(this, &request_);
    listener_->onRequestReady(coreReq_.get());
}

void BeastConnection::handleWriteResponse(const boost::system::error_code& error, bool close)
{
    listener_->onRequestDone(coreReq_.get());

    response_.reset();
    coreReq_.reset();

    if (error)
    {
        logError("handleWriteResponse: %s", error.message().c_str());
        return;
    }

    if (close)
    {
        closeSocket();
        return;
    }

    readRequest();
}

}
