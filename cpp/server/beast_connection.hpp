#pragma once

#include "beast.hpp"
#include "server_core.hpp"
#include "beast_request.hpp"
#include <unordered_set>

namespace msrv {

class BeastConnection;

struct BeastConnectionContext;

class BeastConnection : public std::enable_shared_from_this<BeastConnection>
{
public:
    BeastConnection(
        BeastConnectionContext* context,
        asio::ip::tcp::socket socket);

    ~BeastConnection();

    bool busy() const
    {
        return busy_;
    }

    void run();
    void abort();

    template<typename Response>
    void writeResponse(Response* response)
    {
        auto thisPtr = shared_from_this();
        auto close = response->need_eof();

        busy_ = true;
        beast::http::async_write(
            socket_,
            *response,
            [thisPtr, close](const boost::system::error_code& error, size_t) {
                thisPtr->busy_ = false;
                thisPtr->handleWriteResponse(error, close);
            });
    }

    template<typename Serializer>
    void writeResponseHeader(Serializer* serializer)
    {
        auto thisPtr = shared_from_this();

        busy_ = true;
        beast::http::async_write_header(
            socket_,
            *serializer,
            [thisPtr](const boost::system::error_code& error, size_t) {
                thisPtr->busy_ = false;
                thisPtr->handleWriteResponseHeader(error);
            });
    }

    template<typename Serializer>
    void writeResponseBody(Serializer* serializer, bool close)
    {
        auto thisPtr = shared_from_this();

        busy_ = true;
        beast::http::async_write(
            socket_,
            *serializer,
            [thisPtr, close](const boost::system::error_code& error, size_t) {
                thisPtr->busy_ = false;
                thisPtr->handleWriteResponseBody(error, close);
            });
    }

private:
    void release();
    void closeSocket();
    void readRequest();
    void handleReadRequest(const boost::system::error_code& error);
    void handleWriteResponse(const boost::system::error_code& error, bool close);
    void handleWriteResponseHeader(const boost::system::error_code& error);
    void handleWriteResponseBody(const boost::system::error_code& error, bool close);

    void initCoreRequest();
    void releaseCoreRequest();

    BeastConnectionContext* context_;
    asio::ip::tcp::socket socket_;

    beast::flat_buffer buffer_;
    beast::http::request<beast::http::string_body> request_;

    std::unique_ptr<BeastRequest> coreRequest_;
    bool busy_;
};

struct BeastConnectionContext
{
    BeastConnectionContext()
        : activeConnections(),
          eventListener(nullptr)
    {
    }

    std::unordered_set<std::shared_ptr<BeastConnection>> activeConnections;
    RequestEventListener* eventListener;

    MSRV_NO_COPY_AND_ASSIGN(BeastConnectionContext);
};

}
