#include "beast_connection.hpp"
#include "log.hpp"

namespace msrv {

BeastConnection::BeastConnection(
    BeastConnectionContext* context,
    asio::ip::tcp::socket socket)
    : context_(context),
      socket_(std::move(socket)),
      busy_(false)
{
}

BeastConnection::~BeastConnection() = default;

void BeastConnection::run()
{
    context_->activeConnections.emplace(shared_from_this());
    readRequest();
}

void BeastConnection::abort()
{
    releaseCoreRequest();
    release();
}

void BeastConnection::release()
{
    context_->activeConnections.erase(shared_from_this());
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

    busy_= true;
    beast::http::async_read(
        socket_,
        buffer_,
        request_,
        [thisPtr] (const boost::system::error_code& error, size_t)
        {
            thisPtr->busy_ = false;
            thisPtr->handleReadRequest(error);
        });
}

void BeastConnection::handleReadRequest(const boost::system::error_code& error)
{
    if (error == beast::http::error::end_of_stream)
    {
        closeSocket();
        release();
        return;
    }

    if (error)
    {
        logError("handleReadRequest: %s", error.message().c_str());
        release();
        return;
    }

    initCoreRequest();
}

void BeastConnection::handleWriteResponse(const boost::system::error_code& error, bool close)
{
    releaseCoreRequest();

    if (error)
    {
        logError("handleWriteResponse: %s", error.message().c_str());
        release();
        return;
    }

    if (close)
    {
        closeSocket();
        release();
        return;
    }

    readRequest();
}

void BeastConnection::handleWriteResponseHeader(const boost::system::error_code& error)
{
    if (error)
    {
        logError("handleWriteResponseHeader: %s", error.message().c_str());
        releaseCoreRequest();
        release();
        return;
    }

    coreRequest_->requestBodyData();
}

void BeastConnection::handleWriteResponseBody(const boost::system::error_code& error, bool close)
{
    if (error && error != beast::http::error::need_buffer)
    {
        logError("handleWriteResponseBody: %s", error.message().c_str());
        releaseCoreRequest();
        release();
        return;
    }

    if (close)
    {
        releaseCoreRequest();
        closeSocket();
        release();
        return;
    }

    coreRequest_->requestBodyData();
}

void BeastConnection::initCoreRequest()
{
    coreRequest_ = std::make_unique<BeastRequest>(this, &request_);

    tryCatchLog([this]
    {
        context_->eventListener->onRequestReady(coreRequest_.get());
    });
}

void BeastConnection::releaseCoreRequest()
{
    tryCatchLog([this]
    {
        context_->eventListener->onRequestDone(coreRequest_.get());
    });

    coreRequest_.reset();
}

}
