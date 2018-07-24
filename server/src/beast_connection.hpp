#pragma once

#include "beast.hpp"
#include "server_core.hpp"
#include "beast_request.hpp"

namespace msrv {

class BeastConnection : public std::enable_shared_from_this<BeastConnection>
{
public:
    BeastConnection(
        asio::ip::tcp::socket socket,
        RequestEventListener* listener);

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

    asio::ip::tcp::socket socket_;
    RequestEventListener* listener_;
    beast::flat_buffer buffer_;
    beast::http::request<beast::http::string_body> request_;
    std::unique_ptr<BeastRequest> coreReq_;
    std::shared_ptr<void> response_;
};

}
