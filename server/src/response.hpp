#pragma once

#include "http.hpp"
#include "json.hpp"
#include "system.hpp"
#include "file_system.hpp"

#include <boost/thread/future.hpp>

namespace msrv {

class Response;
class ResponseHandler;

class SimpleResponse;
class DataResponse;
class JsonResponse;
class FileResponse;
class EventStreamResponse;
class AsyncResponse;
class ErrorResponse;

using ResponsePtr = std::unique_ptr<Response>;
using ResponseFuture = boost::unique_future<ResponsePtr>;
using EventStreamSource = std::function<Json()>;

class Response
{
public:
    Response(HttpStatus statusVal);
    virtual ~Response();

    virtual void process(ResponseHandler* handler) = 0;

    static std::unique_ptr<SimpleResponse> ok();
    static std::unique_ptr<SimpleResponse> custom(HttpStatus status);
    static std::unique_ptr<SimpleResponse> temporaryRedirect(std::string targetUrl);
    static std::unique_ptr<SimpleResponse> permanentRedirect(std::string targetUrl);
    static std::unique_ptr<FileResponse> file(Path path, FileHandle handle, FileInfo fileInfo, std::string contentType);
    static std::unique_ptr<DataResponse> data(std::vector<uint8_t> data, std::string contentType);
    static std::unique_ptr<JsonResponse> json(Json value);
    static std::unique_ptr<EventStreamResponse> eventStream(EventStreamSource source);
    static std::unique_ptr<AsyncResponse> async(ResponseFuture response);

    static std::unique_ptr<ErrorResponse> notFound() { return error(HttpStatus::S_404_NOT_FOUND); }

    static std::unique_ptr<ErrorResponse> error(
        HttpStatus status,
        std::string message = std::string(),
        std::string parameter = std::string());

    HttpStatus status;
    HttpKeyValueMap headers;

private:
    MSRV_NO_COPY_AND_ASSIGN(Response);
};

class SimpleResponse : public Response
{
public:
    SimpleResponse(HttpStatus statusVal);
    virtual ~SimpleResponse();

    virtual void process(ResponseHandler* handler) override;
};


class DataResponse : public Response
{
public:
    DataResponse(std::vector<uint8_t> dataVal, std::string contentTypeVal);
    virtual ~DataResponse();

    virtual void process(ResponseHandler* handler) override;

    std::vector<uint8_t> data;
    std::string contentType;
};

class JsonResponse : public Response
{
public:
    JsonResponse(Json val);
    virtual ~JsonResponse();

    virtual void process(ResponseHandler* handler) override;

    Json value;
};

class FileResponse : public Response
{
public:
    FileResponse(
        Path pathVal,
        FileHandle handleVal,
        FileInfo infoVal,
        std::string contentTypeVal);

    virtual ~FileResponse();

    virtual void process(ResponseHandler* handler) override;

    const Path path;
    FileHandle handle;
    const FileInfo info;
    const std::string contentType;
};

class EventStreamResponse : public Response
{
public:
    EventStreamResponse(EventStreamSource sourceVal);
    virtual ~EventStreamResponse();

    virtual void process(ResponseHandler* handler) override;

    EventStreamSource source;
};

class AsyncResponse : public Response
{
public:
    AsyncResponse(ResponseFuture response);
    virtual ~AsyncResponse();

    virtual void process(ResponseHandler* handler) override;

    static ResponsePtr unpack(ResponseFuture response);

    ResponseFuture responseFuture;
};

class ErrorResponse : public Response
{
public:
    ErrorResponse(
        HttpStatus statusVal,
        std::string messageVal = std::string(),
        std::string parameterVal = std::string());

    virtual ~ErrorResponse();

    virtual void process(ResponseHandler* handler) override;

    std::string message;
    std::string parameter;
};

void to_json(Json& json, const ErrorResponse& value);

class ResponseHandler
{
public:
    virtual void handleResponse(SimpleResponse*) = 0;
    virtual void handleResponse(DataResponse*) = 0;
    virtual void handleResponse(FileResponse*) = 0;
    virtual void handleResponse(JsonResponse*) = 0;
    virtual void handleResponse(ErrorResponse*) = 0;
    virtual void handleResponse(AsyncResponse*) = 0;
    virtual void handleResponse(EventStreamResponse*) = 0;
};

}
