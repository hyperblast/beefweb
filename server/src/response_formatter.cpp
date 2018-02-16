#include "response_formatter.hpp"

namespace msrv {

void ResponseFormatter::initResponse(Response* response)
{
    responseCore_ = std::make_unique<ResponseCore>();
    responseCore_->status = response->status;
    responseCore_->headers = std::move(response->headers);
}

void ResponseFormatter::format(Response* response)
{
    initResponse(response);
    response->process(this);
    requestCore_->sendResponse(std::move(responseCore_));
}

void ResponseFormatter::formatEventStream(EventStreamResponse* response, Json event)
{
    initResponse(response);
    setHeader(HttpHeader::CONTENT_TYPE, "text/event-stream");
    responseCore_->body = eventToString(event);
    requestCore_->sendResponseBegin(std::move(responseCore_));
}

void ResponseFormatter::formatEvent(Json event)
{
    requestCore_->sendResponseBody(eventToString(event));
}

void ResponseFormatter::handleResponse(SimpleResponse*)
{
    setHeader(HttpHeader::CONTENT_TYPE, "text/plain");
    setHeader(HttpHeader::CONTENT_LENGTH, "0");
}

void ResponseFormatter::handleResponse(DataResponse* response)
{
    setHeader(HttpHeader::CONTENT_TYPE, response->contentType);
    setHeader(HttpHeader::CONTENT_LENGTH, toString(response->data.size()));

    responseCore_->body = std::move(response->data);
}

void ResponseFormatter::handleResponse(FileResponse* response)
{
    setHeader(HttpHeader::CONTENT_TYPE, response->contentType);
    setHeader(HttpHeader::CONTENT_LENGTH, toString(response->info.size));

    responseCore_->body = ResponseCore::File(
        std::move(response->handle), response->info.size);
}

void ResponseFormatter::handleResponse(JsonResponse* response)
{
    formatJson(response->value);
}

void ResponseFormatter::handleResponse(ErrorResponse* response)
{
    formatJson(Json(*response));
}

void ResponseFormatter::handleResponse(EventStreamResponse*)
{
    assert(false);
}

void ResponseFormatter::handleResponse(AsyncResponse*)
{
    assert(false);
}

void ResponseFormatter::formatJson(const Json& value)
{
    auto str = value.dump();
    setHeader(HttpHeader::CONTENT_TYPE, "application/json");
    setHeader(HttpHeader::CONTENT_LENGTH, toString(str.length()));
    responseCore_->body = std::move(str);
}

std::string ResponseFormatter::eventToString(const Json& value)
{
    std::string buffer;

    if (value.is_null())
    {
        buffer = ": ping\n\n";
        return buffer;
    }

    buffer = "data: ";
    buffer.append(value.dump());
    buffer.append("\n\n");
    return buffer;
}

}
