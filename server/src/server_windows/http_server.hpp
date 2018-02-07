#pragma once

#include "iocp.hpp"

#include "../http.hpp"
#include "../string_utils.hpp"

#include <http.h>

#include <boost/variant.hpp>

namespace msrv {
namespace server_windows {

class HttpApiInit;
class HttpServer;
class HttpUrlBinding;
class ReceiveRequestTask;
class SendResponseTask;
class HttpRequest;
class HttpResponse;

using HttpRequestCallback = std::function<void(HttpRequest*)>;

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

    bool isRunning() const { return isRunning_; }

    void setReceiveCallback(HttpRequestCallback callback) { receiveCallback_ = std::move(callback); }
    void setDoneCallback(HttpRequestCallback callback) { doneCallback_ = std::move(callback); }

    void bindPrefix(std::wstring prefix);
    void start();

private:
    friend class HttpRequest;

    static constexpr size_t MAX_REQUESTS = 64;

    void notifyReceive(HttpRequest* request);
    void notifyDone(HttpRequest* request);

    HttpApiInit apiInit_;
    WindowsHandle handle_;

    std::vector<std::unique_ptr<HttpUrlBinding>> boundPrefixes_;
    std::vector<std::unique_ptr<HttpRequest>> requests_;

    HttpRequestCallback receiveCallback_;
    HttpRequestCallback doneCallback_;

    bool isRunning_;

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
    explicit ReceiveRequestTask(HttpRequest* request);
    virtual ~ReceiveRequestTask();

    void run();
    virtual void complete(OverlappedResult* result) override;

    HTTP_REQUEST* request() { return reinterpret_cast<HTTP_REQUEST*>(buffer_.data()); }

private:
    static constexpr size_t INIT_BUFFER_SIZE = 16 * 1024;
    static constexpr size_t MAX_BUFFER_SIZE = 256 * 1024;

    HttpRequest* request_;
    std::vector<char> buffer_;
    HTTP_REQUEST_ID requestId_;
};

class SendResponseTask : public OverlappedTask
{
public:
    explicit SendResponseTask(HttpRequest* request);
    virtual ~SendResponseTask();

    void run(HTTP_REQUEST_ID requestId, std::unique_ptr<HttpResponse> response);
    virtual void complete(OverlappedResult* result) override;

private:
    void prepare();
    void reset();

    HttpRequest* request_;
    std::unique_ptr<HttpResponse> response_;

    ::HTTP_RESPONSE responseData_;
    ::HTTP_DATA_CHUNK bodyChunk_;
    std::vector<::HTTP_UNKNOWN_HEADER> unknownHeaders_;
};

class HttpRequest
{
public:
    explicit HttpRequest(HttpServer* server);
    ~HttpRequest();

    HttpServer* server() const { return server_; }

    std::string getPath();
    HttpKeyValueMap getQueryString();
    HttpKeyValueMap getHeaders();
    StringView getBody();

    void sendResponse(std::unique_ptr<HttpResponse> response);

private:
    friend class HttpServer;
    friend class ReceiveRequestTask;
    friend class SendResponseTask;

    HTTP_REQUEST* data() { return receiveTask_->request(); }

    void receive();
    void notifyReceiveCompleted(OverlappedResult* result);
    void notifySendCompleted(OverlappedResult* result);

    HttpServer* server_;
    TaskPtr<ReceiveRequestTask> receiveTask_;
    TaskPtr<SendResponseTask> sendTask_;

    MSRV_NO_COPY_AND_ASSIGN(HttpRequest);
};

class HttpResponse
{
public:
    using Body = boost::variant<bool, std::string, std::vector<uint8_t>, FileHandle>;

    HttpResponse();
    ~HttpResponse();

    HttpStatus status;
    HttpKeyValueMap headers;
    Body body;

private:
    MSRV_NO_COPY_AND_ASSIGN(HttpResponse);
};

}}
