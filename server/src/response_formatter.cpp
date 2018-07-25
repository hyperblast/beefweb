#include "response_formatter.hpp"

namespace msrv {

void ResponseSender::initResponse(Response* response)
{
    responseCore_ = std::make_unique<ResponseCore>();
    responseCore_->status = response->status;
    responseCore_->headers = std::move(response->headers);
}

void ResponseSender::send(Response* response)
{
    initResponse(response);
    response->process(this);
    requestCore_->sendResponse(std::move(responseCore_));
}

void ResponseSender::sendEventStream(EventStreamResponse* response, Json event)
{
    initResponse(response);
    setHeader(HttpHeader::CONTENT_TYPE, "text/event-stream");
    responseCore_->body = eventToString(event);
    requestCore_->sendResponseBegin(std::move(responseCore_));
}

void ResponseSender::sendEvent(Json event)
{
    requestCore_->sendResponseBody(eventToString(event));
}

void ResponseSender::handleResponse(SimpleResponse*)
{
    setHeader(HttpHeader::CONTENT_TYPE, "text/plain");
    setHeader(HttpHeader::CONTENT_LENGTH, "0");
}

void ResponseSender::handleResponse(DataResponse* response)
{
    setHeader(HttpHeader::CONTENT_TYPE, response->contentType);
    setHeader(HttpHeader::CONTENT_LENGTH, toString(response->data.size()));

    responseCore_->body = std::move(response->data);
}

void ResponseSender::handleResponse(FileResponse* response)
{
    setHeader(HttpHeader::CONTENT_TYPE, response->contentType);
    setHeader(HttpHeader::CONTENT_LENGTH, toString(response->info.size));

    responseCore_->body = ResponseCore::File(
        std::move(response->handle), response->info.size);
}

void ResponseSender::handleResponse(JsonResponse* response)
{
    setJsonBody(response->value);
}

void ResponseSender::handleResponse(ErrorResponse* response)
{
    setJsonBody(Json(*response));
}

void ResponseSender::handleResponse(EventStreamResponse*)
{
    assert(false);
}

void ResponseSender::handleResponse(AsyncResponse*)
{
    assert(false);
}

void ResponseSender::setJsonBody(const Json& value)
{
    auto str = value.dump();
    setHeader(HttpHeader::CONTENT_TYPE, "application/json");
    setHeader(HttpHeader::CONTENT_LENGTH, toString(str.length()));
    responseCore_->body = std::move(str);
}

std::string ResponseSender::eventToString(const Json& value)
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
