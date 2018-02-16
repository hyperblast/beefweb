#pragma once

#include "iocp.hpp"
#include "../server_core.hpp"
#include "../string_utils.hpp"

#include <http.h>

#include <boost/variant.hpp>

namespace msrv {
namespace server_windows {

class HttpApiInit;
class HttpRequestQueue;
class HttpUrlBinding;
class ReceiveRequestTask;
class SendResponseTask;
class HttpRequest;

class HttpApiInit
{
public:
    explicit HttpApiInit(::ULONG flags);

    ~HttpApiInit()
    {
        if (flags_ != 0)
            ::HttpTerminate(flags_, nullptr);
    }

private:
    ::ULONG flags_;

    MSRV_NO_COPY_AND_ASSIGN(HttpApiInit);
};

class HttpRequestQueue
{
public:
    HttpRequestQueue(IoCompletionPort* ioPort);
    ~HttpRequestQueue();

    ::HANDLE handle() { return handle_.get(); }
    bool isRunning() const { return isRunning_; }
    void setListener(RequestEventListener* listener) { listener_ = listener; }

    void bindPrefix(std::wstring prefix);
    void start();

private:
    friend class HttpRequest;

    static constexpr size_t MAX_REQUESTS = 64;

    void notifyReady(HttpRequest* request);
    void notifyDone(HttpRequest* request);

    HttpApiInit apiInit_;
    WindowsHandle handle_;

    std::vector<std::unique_ptr<HttpUrlBinding>> boundPrefixes_;
    std::vector<std::unique_ptr<HttpRequest>> requests_;

    RequestEventListener* listener_;
    bool isRunning_;

    MSRV_NO_COPY_AND_ASSIGN(HttpRequestQueue);
};

class HttpUrlBinding
{
public:
    HttpUrlBinding(HttpRequestQueue* server, std::wstring prefix);
    ~HttpUrlBinding();

private:
    HttpRequestQueue* server_;
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

    void run(HTTP_REQUEST_ID requestId, ResponseCorePtr response);
    virtual void complete(OverlappedResult* result) override;

private:
    void prepare();
    void reset();

    HttpRequest* request_;
    ResponseCorePtr response_;
    ::HTTP_RESPONSE responseData_;
    ::HTTP_DATA_CHUNK bodyChunk_;
    std::vector<::HTTP_UNKNOWN_HEADER> unknownHeaders_;
};

class HttpRequest : public RequestCore
{
public:
    explicit HttpRequest(HttpRequestQueue* server);
    ~HttpRequest();

    HttpRequestQueue* queue() const { return queue_; }

    virtual HttpMethod method() override;
    virtual std::string path() override;
    virtual HttpKeyValueMap headers() override;
    virtual HttpKeyValueMap queryParams() override;
    virtual StringView body() override;
    virtual void releaseResources() override;

    virtual void abort() override;

    virtual void sendResponse(ResponseCorePtr response) override;
    virtual void sendResponseBegin(ResponseCorePtr response) override;
    virtual void sendResponseBody(ResponseCore::Body body) override;
    virtual void sendResponseEnd() override;

private:
    friend class HttpRequestQueue;
    friend class ReceiveRequestTask;
    friend class SendResponseTask;

    HTTP_REQUEST* data() { return receiveTask_->request(); }

    void receive();
    void notifyReceiveCompleted(OverlappedResult* result);
    void notifySendCompleted(OverlappedResult* result);

    HttpRequestQueue* queue_;
    TaskPtr<ReceiveRequestTask> receiveTask_;
    TaskPtr<SendResponseTask> sendTask_;

    MSRV_NO_COPY_AND_ASSIGN(HttpRequest);
};

}}
