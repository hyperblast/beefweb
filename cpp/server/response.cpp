#include "response.hpp"

namespace msrv {

Response::Response(HttpStatus statusVal)
    : status(statusVal), headers()
{
}

Response::~Response() = default;

std::unique_ptr<SimpleResponse> Response::ok()
{
    return std::make_unique<SimpleResponse>(HttpStatus::S_204_NO_CONTENT);
}

std::unique_ptr<SimpleResponse> Response::custom(HttpStatus status)
{
    return std::make_unique<SimpleResponse>(status);
}

std::unique_ptr<SimpleResponse> Response::temporaryRedirect(std::string targetUrl)
{
    auto response = std::make_unique<SimpleResponse>(HttpStatus::S_307_TEMP_REDIRECT);
    response->headers[HttpHeader::LOCATION] = std::move(targetUrl);
    return response;
}

std::unique_ptr<SimpleResponse> Response::permanentRedirect(std::string targetUrl)
{
    auto response = std::make_unique<SimpleResponse>(HttpStatus::S_308_PERM_REDIRECT);
    response->headers[HttpHeader::LOCATION] = std::move(targetUrl);
    return response;
}

std::unique_ptr<FileResponse> Response::file(Path path, FileHandle handle, FileInfo fileInfo, std::string contentType)
{
    return std::make_unique<FileResponse>(
        std::move(path), std::move(handle), std::move(fileInfo), std::move(contentType));
}

std::unique_ptr<DataResponse> Response::data(std::vector<uint8_t> data, std::string contentType)
{
    return std::make_unique<DataResponse>(std::move(data), std::move(contentType));
}

std::unique_ptr<JsonResponse> Response::json(Json value)
{
    return std::make_unique<JsonResponse>(std::move(value));
}

std::unique_ptr<EventStreamResponse> Response::eventStream(EventStreamSource source)
{
    return std::make_unique<EventStreamResponse>(std::move(source));
}

std::unique_ptr<AsyncResponse> Response::async(ResponseFuture response)
{
    return std::make_unique<AsyncResponse>(std::move(response));
}

std::unique_ptr<ErrorResponse> Response::error(
    HttpStatus status, std::string message, std::string parameter)
{
    if (message.empty())
        message = toString(status);

    return std::make_unique<ErrorResponse>(
        status, std::move(message), std::move(parameter));
}

SimpleResponse::SimpleResponse(HttpStatus statusVal)
    : Response(statusVal)
{
}

SimpleResponse::~SimpleResponse() = default;

void SimpleResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

DataResponse::DataResponse(std::vector<uint8_t> dataVal, std::string contentTypeVal)
    : Response(HttpStatus::S_200_OK),
      data(std::move(dataVal)),
      contentType(std::move(contentTypeVal))
{
}

DataResponse::~DataResponse() = default;

void DataResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

FileResponse::FileResponse(
    Path pathVal,
    FileHandle handleVal,
    FileInfo infoVal,
    std::string contentTypeVal)
    : Response(HttpStatus::S_200_OK),
      path(std::move(pathVal)),
      handle(std::move(handleVal)),
      info(std::move(infoVal)),
      contentType(std::move(contentTypeVal))
{
}

FileResponse::~FileResponse()
{
}

void FileResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

JsonResponse::JsonResponse(Json val)
    : Response(HttpStatus::S_200_OK), value(std::move(val))
{
}

JsonResponse::~JsonResponse()
{
}

void JsonResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

EventStreamResponse::EventStreamResponse(EventStreamSource sourceVal)
    : Response(HttpStatus::S_200_OK), source(std::move(sourceVal))
{
}

EventStreamResponse::~EventStreamResponse()
{
}

void EventStreamResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

AsyncResponse::AsyncResponse(ResponseFuture response)
    : Response(HttpStatus::UNDEFINED), responseFuture(std::move(response))
{
}

AsyncResponse::~AsyncResponse()
{
}

void AsyncResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

ResponsePtr AsyncResponse::unpack(ResponseFuture response)
{
    try
    {
        return response.get();
    }
    catch (std::exception& ex)
    {
        return Response::error(HttpStatus::S_500_SERVER_ERROR, ex.what());
    }
}

ErrorResponse::ErrorResponse(
    HttpStatus statusVal, std::string messageVal, std::string parameterVal)
    : Response(statusVal), message(std::move(messageVal)), parameter(std::move(parameterVal))
{
}

ErrorResponse::~ErrorResponse()
{
}

void ErrorResponse::process(ResponseHandler* handler)
{
    handler->handleResponse(this);
}

void to_json(Json& json, const ErrorResponse& value)
{
    auto errorObj = Json{{"message", value.message}};

    if (!value.parameter.empty())
        errorObj["parameter"] = value.parameter;

    json["error"] = errorObj;
}

}
