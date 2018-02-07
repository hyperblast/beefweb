#pragma once

#include "libevent_glue.hpp"
#include "libevhtp_glue.hpp"

#include "../server.hpp"
#include "../http.hpp"
#include "../request.hpp"
#include "../response.hpp"

#include <atomic>
#include <unordered_map>
#include <unordered_set>

namespace msrv {
namespace server_evhtp {

struct RequestContext;

using RequestContextPtr = std::shared_ptr<RequestContext>;

class ServerImpl : public Server, public std::enable_shared_from_this<ServerImpl>
{
public:
    ServerImpl(const ServerConfig* config);

    virtual ~ServerImpl();
    virtual void run() override;
    virtual void exit() override;
    virtual void dispatchEvents() override;

private:
    static void produceEvent(RequestContext* context);
    static void sendEvent(RequestContext* context);
    static void sendResponse(RequestContext* context);

    EvhtpHostPtr createHost(const char* address, int port);
    RequestContextPtr createContext(EvhtpRequest* evreq);

    void registerContext(RequestContextPtr context);
    void unregisterContext(EvhtpRequest* evreq);

    void processRequest(EvhtpRequest* evreq);
    void runHandlerAndProcessResponse(RequestContextPtr context);
    void processResponse(RequestContextPtr request);

    void doDispatchEvents();
    void beginSendEventStream(RequestContextPtr context);
    void produceAndSendEvent(RequestContextPtr context);

    EventBasePtr eventBase_;
    std::unique_ptr<EventBaseWorkQueue> ioQueue_;
    EvhtpHostPtr hostV4_;
    EvhtpHostPtr hostV6_;
    std::unique_ptr<Event> dispatchEventsRequest_;
    std::atomic_bool dispatchEventsRequested_;
    EventPtr keepEventLoopEvent_;
    std::unordered_map<EvhtpRequest*, RequestContextPtr> contexts_;
    std::unordered_map<EvhtpRequest*, RequestContextPtr> eventStreamContexts_;
    ServerConfig config_;

    MSRV_NO_COPY_AND_ASSIGN(ServerImpl);
};

struct RequestContext
{
    RequestContext()
        : evreq(nullptr), workQueue(nullptr), eventStreamResponse(nullptr) { }

    EvhtpRequest* evreq;
    Request request;
    std::weak_ptr<ServerImpl> server;
    WorkQueue* workQueue;
    EventStreamResponse* eventStreamResponse;
    Json lastEvent;

    bool isAlive() const { return evreq != nullptr; }
    Response* response() { return request.response.get(); }
};

class ResponseFormatter : private ResponseHandler
{
public:
    explicit ResponseFormatter(EvhtpRequest*);
    ~ResponseFormatter();

    void format(Response* response);

private:
    virtual void handleResponse(SimpleResponse*) override;
    virtual void handleResponse(DataResponse*) override;
    virtual void handleResponse(FileResponse*) override;
    virtual void handleResponse(JsonResponse*) override;
    virtual void handleResponse(ErrorResponse*) override;
    virtual void handleResponse(EventStreamResponse*) override;
    virtual void handleResponse(AsyncResponse*) override;

    void writeJson(const Json&);

    EvhtpRequest* evreq_;
};

}}
