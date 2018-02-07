#include "http_server.hpp"
#include "header_map.hpp"

#include "../log.hpp"

namespace msrv {
namespace server_windows {

namespace {

class BodyToChunk : public boost::static_visitor<bool>
{
public:
    BodyToChunk(HTTP_DATA_CHUNK* chunk)
        : chunk_(chunk) { }

    bool operator()(bool) const
    {
        return false;
    }

    bool operator()(std::string& str) const
    {
        chunk_->DataChunkType = HttpDataChunkFromMemory;
        chunk_->FromMemory.pBuffer = &str[0];
        chunk_->FromMemory.BufferLength = str.length();
        return true;
    }

    bool operator()(std::vector<uint8_t>& buffer) const
    {
        chunk_->DataChunkType = HttpDataChunkFromMemory;
        chunk_->FromMemory.pBuffer = buffer.data();
        chunk_->FromMemory.BufferLength = buffer.size();
        return true;
    }

    bool operator()(FileHandle& file) const
    {
        chunk_->DataChunkType = HttpDataChunkFromFileHandle;
        chunk_->FromFileHandle.FileHandle = file.get();
        chunk_->FromFileHandle.ByteRange.Length.QuadPart = 0;
        chunk_->FromFileHandle.ByteRange.StartingOffset.QuadPart = HTTP_BYTE_RANGE_TO_EOF;
        return true;
    }

private:
    HTTP_DATA_CHUNK* chunk_;
};

}

HttpServer::HttpServer()
    : apiInit_(HTTP_INITIALIZE_SERVER), isRunning_(false)
{
    HANDLE handle;
    auto ret = ::HttpCreateHttpHandle(&handle, 0);
    throwIfFailed("HttpCreateHttpHandle", ret == NO_ERROR, ret);
    handle_.reset(handle);
}

HttpServer::~HttpServer()
{
    isRunning_ = false;
}

void HttpServer::bindPrefix(std::wstring prefix)
{
    boundPrefixes_.emplace_back(std::make_unique<HttpUrlBinding>(this, std::move(prefix)));
}

void HttpServer::start()
{
    requests_.reserve(MAX_REQUESTS);

    for (auto i = 0; i < MAX_REQUESTS; i++)
        requests_.emplace_back(std::make_unique<HttpRequest>(this));

    isRunning_ = true;

    for (auto& request : requests_)
        request->receive();
}

void HttpServer::notifyReceive(HttpRequest* request)
{
    if (receiveCallback_)
        tryCatchLog([this, request] { receiveCallback_(request); });
}

void HttpServer::notifyDone(HttpRequest* request)
{
    if (doneCallback_)
        tryCatchLog([this, request] { doneCallback_(request); });
}

HttpRequest::HttpRequest(HttpServer* server)
    : server_(server)
{
    receiveTask_ = createTask<ReceiveRequestTask>(this);
    sendTask_ = createTask<SendResponseTask>(this);
}

HttpRequest::~HttpRequest() = default;

std::string HttpRequest::getPath()
{
    return std::string();
}

HttpKeyValueMap HttpRequest::getQueryString()
{
    return HttpKeyValueMap();
}

HttpKeyValueMap HttpRequest::getHeaders()
{
    HttpKeyValueMap result;
    mapRequestHeaders(&data()->Headers, result);
    return result;
}

StringView HttpRequest::getBody()
{
    return StringView();
}

void HttpRequest::sendResponse(std::unique_ptr<HttpResponse> response)
{
    sendTask_->run(data()->RequestId, std::move(response));
}

void HttpRequest::receive()
{
    if (server_->isRunning())
        receiveTask_->run();
}

void HttpRequest::notifyReceiveCompleted(OverlappedResult* result)
{
    if (result->ioError == NO_ERROR)
    {
        server_->notifyReceive(this);
    }
    else
    {
        logError("failed to receive request: %s", formatError(result->ioError).c_str());
        receive();
    }
}

void HttpRequest::notifySendCompleted(OverlappedResult* result)
{
    if (result->ioError != NO_ERROR)
        logError("failed to send response: %s", formatError(result->ioError).c_str());

    server_->notifyDone(this);
    receive();
}

HttpResponse::HttpResponse()
    : status(HttpStatus::UNDEFINED)
{
}

HttpResponse::~HttpResponse() = default;

HttpApiInit::HttpApiInit(::ULONG flags)
    : flags_(0)
{
    ::HTTPAPI_VERSION version = HTTPAPI_VERSION_1;
    auto ret = ::HttpInitialize(version, flags, nullptr);
    throwIfFailed("HttpInitialize", ret == NO_ERROR, ret);
    flags_ = flags;
}

HttpApiInit::~HttpApiInit()
{
    if (flags_ != 0)
        ::HttpTerminate(flags_, nullptr);
}

HttpUrlBinding::HttpUrlBinding(HttpServer* server, std::wstring prefix)
    : server_(nullptr), prefix_(std::move(prefix))
{
    auto ret = ::HttpAddUrl(server->handle(), prefix_.c_str(), nullptr);
    throwIfFailed("HttpAddUrl", ret == NO_ERROR, ret);
    server_ = server;
}

HttpUrlBinding::~HttpUrlBinding()
{
    if (server_)
        ::HttpRemoveUrl(server_->handle(), prefix_.c_str());
}

ReceiveRequestTask::ReceiveRequestTask(HttpRequest* request)
    : request_(request)
{
    buffer_.resize(INIT_BUFFER_SIZE);
}

ReceiveRequestTask::~ReceiveRequestTask() = default;

void ReceiveRequestTask::run()
{
    auto ret = ::HttpReceiveHttpRequest(
        request_->server()->handle(),
        HTTP_NULL_ID,
        HTTP_RECEIVE_REQUEST_FLAG_FLUSH_BODY,
        request(),
        buffer_.size(),
        nullptr,
        toOverlapped());

    throwIfAsyncIoFailed("HttpReceiveHttpRequest", ret);
}

void ReceiveRequestTask::complete(OverlappedResult* result)
{
    request_->notifyReceiveCompleted(result);
}

SendResponseTask::SendResponseTask(HttpRequest* request)
    : request_(request)
{
    reset();
}

SendResponseTask::~SendResponseTask() = default;

void SendResponseTask::run(HTTP_REQUEST_ID requestId, std::unique_ptr<HttpResponse> response)
{
    response_ = std::move(response);
    prepare();

    auto ret = ::HttpSendHttpResponse(
        request_->server()->handle(),
        requestId,
        0,
        &responseData_,
        nullptr,
        nullptr,
        nullptr,
        0,
        toOverlapped(),
        nullptr);

    throwIfAsyncIoFailed("HttpSendHttpResponse", ret);
}

void SendResponseTask::complete(OverlappedResult* result)
{
    reset();
    request_->notifySendCompleted(result);
}

void SendResponseTask::prepare()
{
    assert(response_);

    responseData_.StatusCode = static_cast<::USHORT>(response_->status);
    mapResponseHeaders(response_->headers, &responseData_.Headers, unknownHeaders_);

    if (boost::apply_visitor(BodyToChunk(&bodyChunk_), response_->body))
    {
        responseData_.EntityChunkCount = 1;
        responseData_.pEntityChunks = &bodyChunk_;
    }
    else
    {
        responseData_.EntityChunkCount = 0;
        responseData_.pEntityChunks = nullptr;
    }
}

void SendResponseTask::reset()
{
    ::memset(&response_, 0, sizeof(response_));
    ::memset(&bodyChunk_, 0, sizeof(bodyChunk_));

    response_.reset();
    unknownHeaders_.clear();
}

}}
