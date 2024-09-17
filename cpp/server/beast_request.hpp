#pragma once

#include "server_core.hpp"
#include "beast.hpp"
#include <queue>

namespace msrv {

class BeastConnection;

class BeastResponseStream;

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

    virtual void releaseResources() override
    {
    }

    virtual void abort() override;

    virtual void sendResponse(ResponseCorePtr response) override;
    virtual void sendResponseBegin(ResponseCorePtr response) override;
    virtual void sendResponseBody(ResponseCore::Body body) override;
    virtual void sendResponseEnd() override;

    void requestBodyData();

private:
    BeastConnection* connection_;
    beast::http::request<beast::http::string_body>* request_;
    boost::string_view path_;
    boost::string_view queryParams_;

    std::shared_ptr<void> response_;
    std::unique_ptr<BeastResponseStream> responseStream_;
};

class BeastResponseStream
{
public:
    BeastResponseStream(
        BeastConnection* connection,
        beast::http::request<beast::http::string_body>* request,
        ResponseCore* coreResponse);

    ~BeastResponseStream();

    void writeHeader();
    void writeNextChunk();
    void releaseBuffer();

    void addChunk(ResponseCore::Body chunk);
    void setEndOfStream();

private:
    BeastConnection* connection_;

    beast::http::response<beast::http::buffer_body> response_;
    beast::http::response_serializer<beast::http::buffer_body, beast::http::fields> serializer_;

    ResponseCore::Body currentChunk_;
    std::queue<ResponseCore::Body> pendingChunks_;
    bool endOfStream_;
};

}
