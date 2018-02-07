#pragma once

#include "libevent_glue.hpp"
#include "libevhtp_glue.hpp"

#include "../response.hpp"

namespace msrv {
namespace server_evhtp {

class ResponseFormatter : private ResponseHandler
{
public:
    explicit ResponseFormatter(EvhtpRequest* evreq)
        : evreq_(evreq) { }

    ~ResponseFormatter() = default;

    void format(Response* response);

private:
    virtual void handleResponse(SimpleResponse*) override;
    virtual void handleResponse(DataResponse*) override;
    virtual void handleResponse(FileResponse*) override;
    virtual void handleResponse(JsonResponse*) override;
    virtual void handleResponse(ErrorResponse*) override;
    virtual void handleResponse(EventStreamResponse*) override;
    virtual void handleResponse(AsyncResponse*) override;

    void writeJson(const Json&);

    EvhtpRequest* evreq_;
};


}}
