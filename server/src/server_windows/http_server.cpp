#include "http_server.hpp"
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

HttpServer::HttpServer()
{
    HANDLE handle;
    auto ret = ::HttpCreateHttpHandle(&handle, 0);
    throwIfFailed("HttpCreateHttpHandle", ret == NO_ERROR, ret);
    handle_.reset(handle);
}

HttpServer::~HttpServer() = default;

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

ReceiveRequestTask::ReceiveRequestTask(HttpServer* server, TaskCallback<ReceiveRequestTask> callback)
    : server_(server), callback_(std::move(callback))
{
    buffer_.resize(INIT_BUFFER_SIZE);
}

ReceiveRequestTask::~ReceiveRequestTask() = default;

void ReceiveRequestTask::execute()
{
    auto ret = ::HttpReceiveHttpRequest(
        server_->handle(),
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
    if (callback_)
        tryCatchLog([this, result] { callback_(this, result->ioError); });
}

SendResponseTask::SendResponseTask(HttpServer* server, TaskCallback<SendResponseTask> callback)
    : server_(server), callback_(std::move(callback))
{
}

SendResponseTask::~SendResponseTask() = default;

void SendResponseTask::execute()
{
    auto ret = ::HttpSendHttpResponse(
        server_->handle(),
        requestId_,
        0,
        &response_,
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
    setRequestId(HTTP_NULL_ID);
    setBody(false);

    if (callback_)
        tryCatchLog([this, result] { callback_(this, result->ioError); });
}

void SendResponseTask::prepare()
{
    if (boost::apply_visitor(BodyToChunk(&bodyChunk_), body_))
    {
        response_.EntityChunkCount = 1;
        response_.pEntityChunks = &bodyChunk_;
    }
    else
    {
        response_.EntityChunkCount = 0;
        response_.pEntityChunks = nullptr;
    }
}

}}
