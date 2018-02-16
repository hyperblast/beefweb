#pragma once

#include "response.hpp"
#include "server_core.hpp"

namespace msrv {

class RequestCore;

class ResponseFormatter : private ResponseHandler
{
public:
    explicit ResponseFormatter(RequestCore* corereq)
        : requestCore_(corereq) { }

    ~ResponseFormatter() = default;

    void format(Response* response);
    void formatEvent(Json event);
    void formatEventStream(EventStreamResponse* response, Json event);

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

    void formatJson(const Json& value);

    void setHeader(std::string key, std::string value)
    {
        responseCore_->headers[std::move(key)] = std::move(value);
    }

    RequestCore* requestCore_;
    ResponseCorePtr responseCore_;
};

}
