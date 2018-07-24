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
        : idleConnections(),
          eventListener(nullptr) { }

    std::unordered_set<std::shared_ptr<BeastConnection>> idleConnections;
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

    void run();
    void abort();

    template<typename Response>
    void sendResponse(std::shared_ptr<Response> response)
    {
        auto thisPtr = shared_from_this();

        response_ = response;

        beast::http::async_write(
            socket_,
            *response,
            [thisPtr, response] (const boost::system::error_code& error, size_t)
            {
                thisPtr->handleWriteResponse(error, response->need_eof());
            });
    }

private:
    void closeSocket();
    void readRequest();
    void handleReadRequest(const boost::system::error_code& error);
    void handleWriteResponse(const boost::system::error_code& error, bool close);

    BeastConnectionContext* context_;
    asio::ip::tcp::socket socket_;

    beast::flat_buffer buffer_;
    beast::http::request<beast::http::string_body> request_;
    std::unique_ptr<BeastRequest> coreReq_;
    std::shared_ptr<void> response_;
};

}
