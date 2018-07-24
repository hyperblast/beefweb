#pragma once

#include "server_core.hpp"
#include "beast.hpp"

namespace msrv {

class BeastConnection;

class BeastRequest : public RequestCore
{
public:
    BeastRequest(
        BeastConnection* connection,
        beast::http::request<beast::http::string_body>* request);

    ~BeastRequest();

    virtual HttpMethod method() override;
    virtual std::string path() override;
    virtual HttpKeyValueMap headers() override;
    virtual HttpKeyValueMap queryParams() override;
    virtual StringView body() override;

    virtual void releaseResources() override { }
    virtual void abort() override;

    virtual void sendResponse(ResponseCorePtr response) override;
    virtual void sendResponseBegin(ResponseCorePtr response) override;
    virtual void sendResponseBody(ResponseCore::Body body) override;
    virtual void sendResponseEnd() override;

private:
    BeastConnection* connection_;
    beast::http::request<beast::http::string_body>* request_;
    boost::string_view path_;
    boost::string_view queryParams_;
    ResponseCorePtr response_;
};

}
