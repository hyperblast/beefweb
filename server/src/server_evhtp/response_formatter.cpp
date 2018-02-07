#include "response_formatter.hpp"

namespace msrv {
namespace server_evhtp {

void ResponseFormatter::format(Response* response)
{
    for (auto& header : response->headers)
        evreq_->outputHeaders()->set(header.first, header.second);

    response->process(this);

    evreq_->sendResponse(static_cast<int>(response->status));
}

void ResponseFormatter::handleResponse(SimpleResponse*)
{
    evreq_->outputHeaders()->set("Content-Type", "text/plain");
    evreq_->outputHeaders()->set("Content-Length", "0");
}

void ResponseFormatter::handleResponse(DataResponse* response)
{
    evreq_->outputHeaders()->set("Content-Type", response->contentType);
    evreq_->outputHeaders()->set("Content-Length", toString(response->data.size()));

    if (response->data.size() > 0)
    {
        evreq_->outputBuffer()->write(
            reinterpret_cast<const char*>(response->data.data()),
            response->data.size());
    }
}

void ResponseFormatter::handleResponse(FileResponse* response)
{
    evreq_->outputHeaders()->set("Content-Type", response->contentType);
    evreq_->outputHeaders()->set("Content-Length", toString(response->info.size));

    if (response->info.size > 0)
        evreq_->outputBuffer()->writeFile(std::move(response->handle), 0, response->info.size);
}

void ResponseFormatter::handleResponse(JsonResponse* response)
{
    writeJson(response->value);
}

void ResponseFormatter::handleResponse(ErrorResponse* response)
{
    writeJson(Json(*response));
}

void ResponseFormatter::handleResponse(EventStreamResponse*)
{
    throw std::logic_error("EventStreamResponse should not be handled by this object");
}

void ResponseFormatter::handleResponse(AsyncResponse*)
{
    throw std::logic_error("AsyncResponse should not be handled by this object");
}

void ResponseFormatter::writeJson(const Json& json)
{
    auto jsonString = json.dump();

    evreq_->outputHeaders()->set("Content-Type", "application/json");
    evreq_->outputHeaders()->set("Content-Length", toString(jsonString.length()));
    evreq_->outputBuffer()->write(jsonString);
}

}}
