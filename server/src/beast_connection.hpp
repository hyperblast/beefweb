#pragma once

#include "beast.hpp"
#include "server_core.hpp"
#include "beast_request.hpp"
#include <unordered_set>

namespace msrv {

class BeastConnection;

struct BeastConnectionContext
{
    BeastConnectionContext()
        : activeConnections(),
          eventListener(nullptr) { }

    std::unordered_set<std::shared_ptr<BeastConnection>> activeConnections;
    RequestEventListener* eventListener;

    MSRV_NO_COPY_AND_ASSIGN(BeastConnectionContext);
};

class BeastConnection : public std::enable_shared_from_this<BeastConnection>
{
public:
    BeastConnection(
        BeastConnectionContext* context,
        asio::ip::tcp::socket socket);

    ~BeastConnection();

    bool busy() const { return busy_; }

    void run();
    void abort();

    template<typename Response>
    void writeResponse(Response* response)
    {
        auto needEof = response->need_eof();

        busy_ = true;
        beast::http::async_write(
            socket_,
            *response,
            [this, needEof] (const boost::system::error_code& error, size_t)
            {
                busy_ = false;
                handleWriteResponse(error, needEof);
            });
    }

    template<typename Serializer>
    void writeResponseHeader(Serializer* serializer)
    {
        busy_ = true;
        beast::http::async_write_header(
            socket_,
            *serializer,
            [this] (const boost::system::error_code& error, size_t)
            {
                busy_ = false;
                handleWriteResponseHeader(error);
            });
    }

    template<typename Serializer>
    void writeResponseBody(Serializer* serializer, bool close)
    {
        busy_ = true;
        beast::http::async_write(
            socket_,
            *serializer,
            [this, close] (const boost::system::error_code& error, size_t)
            {
                busy_ = true;
                handleWriteResponseBody(error, close);
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

}
