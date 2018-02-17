#include "http_api.hpp"
#include "header_map.hpp"

#include "../log.hpp"
#include "../charset.hpp"
#include "../string_utils.hpp"

namespace msrv {
namespace server_windows {

namespace {

void logIfError(const char* func, DWORD errorCode)
{
    if (errorCode != NO_ERROR)
        logError("%s", formatErrorFor(func, errorCode).c_str());
}

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

HttpApiInit::HttpApiInit(ULONG flags)
    : flags_(0)
{
    auto ret = ::HttpInitialize(HTTPAPI_VERSION_2, flags, nullptr);
    throwIfFailed("HttpInitialize", ret == NO_ERROR, ret);
    flags_ = flags;
}

HttpRequestQueue::HttpRequestQueue(IoCompletionPort* ioPort)
    : apiInit_(HTTP_INITIALIZE_SERVER),
      queueHandle_(nullptr),
      sessionId_(HTTP_NULL_ID),
      urlGroupId_(HTTP_NULL_ID)
{
    auto ret = ::HttpCreateRequestQueue(HTTPAPI_VERSION_2, nullptr, nullptr, 0, &queueHandle_);
    throwIfFailed("HttpCreateHttpHandle", ret == NO_ERROR, ret);

    ret = ::HttpCreateServerSession(HTTPAPI_VERSION_2, &sessionId_, 0);
    throwIfFailed("HttpCreateServerSession", ret == NO_ERROR, ret);

    ret = ::HttpCreateUrlGroup(sessionId_, &urlGroupId_, 0);
    throwIfFailed("HttpCreateUrlGroup", ret == NO_ERROR, ret);

    HTTP_BINDING_INFO bindingInfo;
    bindingInfo.Flags.Present = 1;
    bindingInfo.RequestQueueHandle = queueHandle_;
    ret = ::HttpSetUrlGroupProperty(
        urlGroupId_, HttpServerBindingProperty, &bindingInfo, sizeof(bindingInfo));
    throwIfFailed("HttpSetUrlGroupProperty", ret == NO_ERROR, ret);

    ioPort->bindHandle(queueHandle_);
}

HttpRequestQueue::~HttpRequestQueue()
{
    if (urlGroupId_ != HTTP_NULL_ID)
        logIfError("HttpCloseUrlGroup", ::HttpCloseUrlGroup(urlGroupId_));

    if (sessionId_ != HTTP_NULL_ID)
        logIfError("HttpCloseServerSession", ::HttpCloseServerSession(sessionId_));

    if (queueHandle_)
        logIfError("HttpCloseRequestQueue", ::HttpCloseRequestQueue(queueHandle_));
}

void HttpRequestQueue::bind(const std::wstring& prefix)
{
    auto ret = ::HttpAddUrlToUrlGroup(urlGroupId_, prefix.c_str(), 0, 0);
    throwIfFailed("HttpAddUrlToUrlGroup", ret == NO_ERROR, ret);
}

void HttpRequestQueue::start()
{
    requests_.reserve(MAX_REQUESTS);

    for (auto i = 0; i < MAX_REQUESTS; i++)
        requests_.emplace_back(std::make_unique<HttpRequest>(this));

    for (auto& request : requests_)
        request->receive();
}

void HttpRequestQueue::notifyReady(HttpRequest* request)
{
    if (listener_)
        tryCatchLog([this, request] { listener_->onRequestReady(request); });
}

void HttpRequestQueue::notifyDone(HttpRequest* request, bool wasReady)
{
    if (wasReady && listener_)
        tryCatchLog([this, request] { listener_->onRequestDone(request); });

    request->reset();
    request->receive();
}

HttpRequest::HttpRequest(HttpRequestQueue* queue)
    : queue_(queue)
{
    receiveTask_ = createTask<ReceiveRequestTask>(this);
    sendTask_ = createTask<SendResponseTask>(this);

    reset();
}

HttpRequest::~HttpRequest() = default;

HttpMethod HttpRequest::method()
{
    switch (data()->Verb)
    {
    case HttpVerbGET:
        return HttpMethod::GET;
    case HttpVerbPOST:
        return HttpMethod::POST;
    default:
        return HttpMethod::UNDEFINED;
    }
}

std::string HttpRequest::path()
{
    auto& url = data()->CookedUrl;
    return utf16To8(url.pAbsPath, url.AbsPathLength / sizeof(wchar_t));
}

HttpKeyValueMap HttpRequest::headers()
{
    HttpKeyValueMap map;
    mapRequestHeaders(&data()->Headers, &map);
    return map;
}

HttpKeyValueMap HttpRequest::queryParams()
{
    auto& url = data()->CookedUrl;
    auto queryString = utf16To8(url.pQueryString, url.QueryStringLength / sizeof(wchar_t));
    return parseQueryString(queryString);
}

StringView HttpRequest::body()
{
    switch (data()->EntityChunkCount)
    {
        case 0:
            return StringView();

        case 1:
        {
            auto& chunk = data()->pEntityChunks[0].FromMemory;
            return StringView(reinterpret_cast<const char*>(chunk.pBuffer), chunk.BufferLength);
        }

        default:
            return StringView("TODO");
    }
}

void HttpRequest::releaseResources()
{
}

void HttpRequest::abort()
{
}

void HttpRequest::sendResponse(ResponseCorePtr response)
{
    endAfterSendingAllChunks_ = true;
    sendTask_->run(requestId_, std::move(response), 0);
}

void HttpRequest::sendResponseBegin(ResponseCorePtr response)
{
    sendTask_->run(requestId_, std::move(response), HTTP_SEND_RESPONSE_FLAG_MORE_DATA);
}

void HttpRequest::sendResponseBody(ResponseCore::Body body)
{
    if (sendTask_->isBusy())
        pendingChunks_.emplace_back(std::move(body));
    else
        sendTask_->run(requestId_, std::move(body), HTTP_SEND_RESPONSE_FLAG_MORE_DATA);
}

void HttpRequest::sendResponseEnd()
{
    endAfterSendingAllChunks_ = true;
    sendTask_->run(requestId_, ResponseCore::Body(false), 0);
}

void HttpRequest::receive()
{
    receiveTask_->run();
}

void HttpRequest::reset()
{
    HTTP_SET_NULL_ID(&requestId_);
    endAfterSendingAllChunks_ = false;
    pendingChunks_.clear();
    receiveTask_->reset();
}

void HttpRequest::notifyReceiveCompleted(OverlappedResult* result)
{
    if (result->ioError != NO_ERROR)
    {
        logError("failed to receive request: %s", formatError(result->ioError).c_str());
        queue_->notifyDone(this, false);
        return;
    }

    requestId_ = data()->RequestId;
    queue_->notifyReady(this);
}

void HttpRequest::notifySendCompleted(OverlappedResult* result)
{
    if (result->ioError != NO_ERROR)
    {
        if (result->ioError != ERROR_CONNECTION_INVALID)
            logError("failed to send response: %s", formatError(result->ioError).c_str());

        queue_->notifyDone(this, true);
        return;
    }

    if (!pendingChunks_.empty())
    {
        auto body = std::move(pendingChunks_.front());
        pendingChunks_.pop_front();
        sendTask_->run(requestId_, std::move(body), HTTP_SEND_RESPONSE_FLAG_MORE_DATA);
        return;
    }

    if (endAfterSendingAllChunks_)
        queue_->notifyDone(this, true);
}

ReceiveRequestTask::ReceiveRequestTask(HttpRequest* request)
    : request_(request)
{
    buffer_.reset(reinterpret_cast<char*>(::malloc(BUFFER_SIZE)));

    if (!buffer_)
        throw std::bad_alloc();
}

ReceiveRequestTask::~ReceiveRequestTask() = default;

void ReceiveRequestTask::run()
{
    auto ret = ::HttpReceiveHttpRequest(
        request_->queue()->handle(),
        HTTP_NULL_ID,
        HTTP_RECEIVE_REQUEST_FLAG_FLUSH_BODY,
        request(),
        BUFFER_SIZE,
        nullptr,
        toOverlapped());

    handleAsyncIoResult(ret);
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

void SendResponseTask::run(HTTP_REQUEST_ID requestId, ResponseCorePtr response, ULONG flags)
{
    setResponse(std::move(response));

    auto ret = ::HttpSendHttpResponse(
        request_->queue()->handle(),
        requestId,
        flags,
        &responseData_,
        nullptr,
        nullptr,
        nullptr,
        0,
        toOverlapped(),
        nullptr);

    isBusy_ = true;
    handleAsyncIoResult(ret);
}

void SendResponseTask::run(HTTP_REQUEST_ID requestId, ResponseCore::Body body, ULONG flags)
{
    setBody(std::move(body));

    auto ret = ::HttpSendResponseEntityBody(
        request_->queue()->handle(),
        requestId,
        flags,
        responseData_.EntityChunkCount,
        responseData_.pEntityChunks,
        nullptr,
        nullptr,
        0,
        toOverlapped(),
        nullptr);

    isBusy_ = true;
    return handleAsyncIoResult(ret);
}

void SendResponseTask::complete(OverlappedResult* result)
{
    reset();
    request_->notifySendCompleted(result);
}

void SendResponseTask::setResponse(ResponseCorePtr response)
{
    response_ = std::move(response);
    responseData_.StatusCode = static_cast<USHORT>(response_->status);
    mapResponseHeaders(&response_->headers, &responseData_.Headers, &unknownHeaders_);
    setBody(std::move(response_->body));
}

void SendResponseTask::setBody(ResponseCore::Body body)
{
    body_ = std::move(body);

    if (boost::apply_visitor(BodyFormatter(&bodyChunk_), body_))
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
    ::memset(&responseData_, 0, sizeof(responseData_));
    ::memset(&bodyChunk_, 0, sizeof(bodyChunk_));

    response_.reset();
    body_ = false;
    unknownHeaders_.clear();
    isBusy_ = false;
}

}}
