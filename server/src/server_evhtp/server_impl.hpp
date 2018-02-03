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

class ServerImpl : public Server
{
public:
    ServerImpl(const ServerConfig* config);

    virtual ~ServerImpl();
    virtual void run() override;
    virtual void exit() override;
    virtual void dispatchEvents() override;

private:
    EvhtpHostPtr createHost(const char* address, int port);
    RequestSharedPtr createRequest(EvhtpRequest* evreq);

    void processRequest(EvhtpRequest* evreq);
    void doDispatchEvents();
    void sendEvent(EvhtpRequest* evreq, EventStreamResponse* response);
    void trackRequest(EvhtpRequest* evreq, RequestSharedPtr request);
    void processResponse(EvhtpRequest* evreq, RequestSharedPtr request);
    void processEventStreamResponse(EvhtpRequest* evreq, EventStreamResponse* streamResponse);
    void processAsyncResponse(EvhtpRequest* evreq, RequestSharedPtr request, AsyncResponse* asyncResponse);

    WorkQueue* getWorkQueue(RequestHandler* handler)
    {
        auto* queue = handler->workQueue();
        return queue ? queue : config_.defaultWorkQueue;
    }

    EventBasePtr eventBase_;
    std::unique_ptr<EventBaseWorkQueue> ioQueue_;
    EvhtpHostPtr hostV4_;
    EvhtpHostPtr hostV6_;
    std::unique_ptr<Event> dispatchEventsRequest_;
    std::atomic_bool dispatchEventsRequested_;
    EventPtr keepEventLoopEvent_;
    std::unordered_map<int64_t, EvhtpRequest*> evreqMap_;
    std::unordered_map<int64_t, RequestSharedPtr> requestMap_;
    std::unordered_set<int64_t> eventStreamResponses_;
    ServerConfig config_;
    int64_t lastRequestId_;

    MSRV_NO_COPY_AND_ASSIGN(ServerImpl);
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
