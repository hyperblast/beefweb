#pragma once

#include "iocp.hpp"

#include <boost/variant.hpp>

#include <http.h>

namespace msrv {
namespace server_windows {

class HttpApiInit
{
public:
    explicit HttpApiInit(::ULONG flags);
    ~HttpApiInit();

private:
    ::ULONG flags_;

    MSRV_NO_COPY_AND_ASSIGN(HttpApiInit);
};

class HttpServer
{
public:
    HttpServer();
    ~HttpServer();

    ::HANDLE handle() { return handle_.get(); }

private:
    WindowsHandle handle_;

    MSRV_NO_COPY_AND_ASSIGN(HttpServer);
};

class HttpUrlBinding
{
public:
    HttpUrlBinding(HttpServer* server, std::wstring prefix);
    ~HttpUrlBinding();

private:
    HttpServer* server_;
    std::wstring prefix_;

    MSRV_NO_COPY_AND_ASSIGN(HttpUrlBinding);
};

class ReceiveRequestTask : public OverlappedTask
{
public:
    ReceiveRequestTask(
        HttpServer* server,
        TaskCallback<ReceiveRequestTask> callback = TaskCallback<ReceiveRequestTask>());
    virtual ~ReceiveRequestTask();

    void execute();
    virtual void complete(OverlappedResult* result) override;

    HTTP_REQUEST* request() { return reinterpret_cast<HTTP_REQUEST*>(buffer_.data()); }

private:
    static constexpr size_t INIT_BUFFER_SIZE = 16 * 1024;
    static constexpr size_t MAX_BUFFER_SIZE = 256 * 1024;

    HttpServer* server_;
    TaskCallback<ReceiveRequestTask> callback_;
    std::vector<char> buffer_;
    HTTP_REQUEST_ID requestId_;
};

class SendResponseTask : public OverlappedTask
{
public:
    SendResponseTask(
        HttpServer* server,
        TaskCallback<SendResponseTask> callback = TaskCallback<SendResponseTask>());
    virtual ~SendResponseTask();

    void setRequestId(HTTP_REQUEST_ID id) { requestId_ = id; }
    template<typename T> void setBody(T body) { body_ = Body(std::move(body)); }

    void execute();
    virtual void complete(OverlappedResult* result) override;

private:
    using Body = boost::variant<bool, std::string, std::vector<uint8_t>, FileHandle>;

    void prepare();

    HttpServer* server_;
    TaskCallback<SendResponseTask> callback_;
    HTTP_REQUEST_ID requestId_;
    HTTP_RESPONSE response_;
    HTTP_DATA_CHUNK bodyChunk_;
    Body body_;
};

}}
