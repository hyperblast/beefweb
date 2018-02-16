#include "http_api.hpp"
#include "header_map.hpp"

#include "../log.hpp"

namespace msrv {
namespace server_windows {

namespace {

class BodyFormatter : public boost::static_visitor<bool>
{
public:
    BodyFormatter(HTTP_DATA_CHUNK* output)
        : output_(output) { }

    bool operator()(bool) const
    {
        return false;
    }

    bool operator()(std::string& str) const
    {
        if (str.empty())
            return false;

        output_->DataChunkType = HttpDataChunkFromMemory;
        output_->FromMemory.pBuffer = &str[0];
        output_->FromMemory.BufferLength = str.length();
        return true;
    }

    bool operator()(std::vector<uint8_t>& buffer) const
    {
        if (buffer.empty())
            return false;

        output_->DataChunkType = HttpDataChunkFromMemory;
        output_->FromMemory.pBuffer = buffer.data();
        output_->FromMemory.BufferLength = buffer.size();
        return true;
    }

    bool operator()(ResponseCore::File& file) const
    {
        if (file.size == 0)
            return false;

        output_->DataChunkType = HttpDataChunkFromFileHandle;
        output_->FromFileHandle.FileHandle = file.handle.get();
        output_->FromFileHandle.ByteRange.StartingOffset.QuadPart = 0;
        output_->FromFileHandle.ByteRange.Length.QuadPart = static_cast<::ULONGLONG>(file.size);
        return true;
    }

private:
    HTTP_DATA_CHUNK* output_;
};

}

HttpApiInit::HttpApiInit(::ULONG flags)
    : flags_(0)
{
    ::HTTPAPI_VERSION version = HTTPAPI_VERSION_1;
    auto ret = ::HttpInitialize(version, flags, nullptr);
    throwIfFailed("HttpInitialize", ret == NO_ERROR, ret);
    flags_ = flags;
}

HttpRequestQueue::HttpRequestQueue(IoCompletionPort* ioPort)
    : apiInit_(HTTP_INITIALIZE_SERVER), isRunning_(false)
{
    HANDLE handle;
    auto ret = ::HttpCreateHttpHandle(&handle, 0);
    throwIfFailed("HttpCreateHttpHandle", ret == NO_ERROR, ret);
    handle_.reset(handle);

    ioPort->bindHandle(handle);
}

HttpRequestQueue::~HttpRequestQueue()
{
    isRunning_ = false;
}

void HttpRequestQueue::bindPrefix(std::wstring prefix)
{
    boundPrefixes_.emplace_back(std::make_unique<HttpUrlBinding>(this, std::move(prefix)));
}

void HttpRequestQueue::start()
{
    requests_.reserve(MAX_REQUESTS);

    for (auto i = 0; i < MAX_REQUESTS; i++)
        requests_.emplace_back(std::make_unique<HttpRequest>(this));

    isRunning_ = true;

    for (auto& request : requests_)
        request->receive();
}

void HttpRequestQueue::notifyReady(HttpRequest* request)
{
    if (listener_)
        tryCatchLog([this, request] { listener_->onRequestReady(request); });
}

void HttpRequestQueue::notifyDone(HttpRequest* request)
{
    if (listener_)
        tryCatchLog([this, request] { listener_->onRequestDone(request); });
}

HttpRequest::HttpRequest(HttpRequestQueue* queue)
    : queue_(queue)
{
    receiveTask_ = createTask<ReceiveRequestTask>(this);
    sendTask_ = createTask<SendResponseTask>(this);
}

HttpRequest::~HttpRequest() = default;

HttpMethod HttpRequest::method()
{
    return HttpMethod::UNDEFINED;
}

std::string HttpRequest::path()
{
    return std::string();
}

HttpKeyValueMap HttpRequest::headers()
{
    HttpKeyValueMap map;
    mapRequestHeaders(&data()->Headers, map);
    return map;
}

HttpKeyValueMap HttpRequest::queryParams()
{
    return HttpKeyValueMap();
}

StringView HttpRequest::body()
{
    return StringView();
}

void HttpRequest::releaseResources()
{
}

void HttpRequest::abort()
{
}

void HttpRequest::sendResponse(ResponseCorePtr response)
{
}

void HttpRequest::sendResponseBegin(ResponseCorePtr response)
{
}

void HttpRequest::sendResponseBody(ResponseCore::Body body)
{
}

void HttpRequest::sendResponseEnd()
{
}

void HttpRequest::receive()
{
    if (queue_->isRunning())
        receiveTask_->run();
}

void HttpRequest::notifyReceiveCompleted(OverlappedResult* result)
{
    if (result->ioError == NO_ERROR)
    {
        queue_->notifyReady(this);
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

    queue_->notifyDone(this);
    receive();
}

HttpUrlBinding::HttpUrlBinding(HttpRequestQueue* server, std::wstring prefix)
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
        request_->queue()->handle(),
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

void SendResponseTask::run(HTTP_REQUEST_ID requestId, ResponseCorePtr response)
{
    response_ = std::move(response);
    prepare();

    auto ret = ::HttpSendHttpResponse(
        request_->queue()->handle(),
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

    if (boost::apply_visitor(BodyFormatter(&bodyChunk_), response_->body))
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
