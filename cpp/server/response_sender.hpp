#pragma once

#include "response.hpp"
#include "server_core.hpp"

namespace msrv {

class RequestCore;

class ResponseSender : private ResponseHandler
{
public:
    explicit ResponseSender(RequestCore* corereq)
        : requestCore_(corereq)
    {
    }

    ~ResponseSender() = default;

    void send(Response* response);
    void sendEvent(Json event);
    void sendEventStream(EventStreamResponse* response, Json event);

private:
    static std::string eventToString(const Json& value);

    void initResponse(Response* response);

    virtual void handleResponse(SimpleResponse*) override;
    virtual void handleResponse(DataResponse*) override;
    virtual void handleResponse(FileResponse*) override;
    virtual void handleResponse(JsonResponse*) override;
    virtual void handleResponse(ErrorResponse*) override;
    virtual void handleResponse(EventStreamResponse*) override;
    virtual void handleResponse(AsyncResponse*) override;

    void setJsonBody(const Json& value);

    void setHeader(std::string key, std::string value)
    {
        responseCore_->headers[std::move(key)] = std::move(value);
    }

    RequestCore* requestCore_;
    ResponseCorePtr responseCore_;
};

}
