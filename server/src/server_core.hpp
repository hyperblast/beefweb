#pragma once

#include "defines.hpp"
#include "http.hpp"
#include "system.hpp"
#include "string_utils.hpp"

#include <string>
#include <vector>
#include <memory>

#include <boost/variant.hpp>

namespace msrv {

class WorkQueue;
class TimerFactory;

class ServerCore;
class RequestCore;
class ResponseCore;
class RequestEventListener;

using ServerCorePtr = std::unique_ptr<ServerCore>;
using ResponseCorePtr = std::unique_ptr<ResponseCore>;

class ServerCore
{
public:
    static ServerCorePtr create();

    ServerCore() = default;
    virtual ~ServerCore();

    virtual WorkQueue* workQueue() = 0;
    virtual TimerFactory* timerFactory() = 0;

    virtual void setEventListener(RequestEventListener* listener) = 0;
    virtual void bind(int port, bool allowRemote) = 0;
    virtual void run() = 0;
    virtual void exit() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(ServerCore);
};

class ResponseCore
{
public:
    struct FileBody
    {
        FileBody()
            : handle(), size(0) { }

        FileBody(FileHandle handleVal, int64_t sizeVal)
            : handle(std::move(handleVal)), size(sizeVal) { }

        FileBody(const FileBody&) = delete;
        FileBody(FileBody&&) = default;

        FileBody& operator=(const FileBody&) = delete;
        FileBody& operator=(FileBody&&) = default;

        FileHandle handle;
        int64_t size;
    };

    using Body = boost::variant<bool, std::string, std::vector<uint8_t>, FileBody>;

    ResponseCore()
        : status(HttpStatus::UNDEFINED), headers(), body(false) { }

    ~ResponseCore() = default;

    HttpStatus status;
    HttpKeyValueMap headers;
    Body body;

private:
    MSRV_NO_COPY_AND_ASSIGN(ResponseCore);
};

class RequestCore
{
public:
    virtual HttpMethod method() = 0;
    virtual std::string path() = 0;
    virtual HttpKeyValueMap headers() = 0;
    virtual HttpKeyValueMap queryParams() = 0;
    virtual StringView body() = 0;
    virtual void releaseResources() = 0;

    virtual void abort() = 0;

    virtual void sendResponse(ResponseCorePtr response) = 0;
    virtual void sendResponseBegin(ResponseCorePtr response) = 0;
    virtual void sendResponseBody(ResponseCore::Body body) = 0;
    virtual void sendResponseEnd() = 0;

protected:
    RequestCore() = default;
    ~RequestCore() = default;

private:
    MSRV_NO_COPY_AND_ASSIGN(RequestCore);
};

class RequestEventListener
{
public:
    virtual void onRequestReady(RequestCore* request) = 0;
    virtual void onRequestDone(RequestCore* request) = 0;

protected:
    RequestEventListener() = default;
    ~RequestEventListener() = default;

private:
    MSRV_NO_COPY_AND_ASSIGN(RequestEventListener);
};

}
