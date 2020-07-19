#pragma once

#include "defines.hpp"
#include "chrono.hpp"
#include "server_core.hpp"
#include "request.hpp"
#include "response.hpp"
#include "timers.hpp"
#include "request_filter.hpp"
#include "router.hpp"

#include <memory>
#include <thread>

#include <boost/thread/future.hpp>

namespace msrv {

class WorkQueue;

class Server;
struct ServerConfig;
struct RequestContext;

using ServerPtr = std::shared_ptr<Server>;
using ServerConfigPtr = std::unique_ptr<ServerConfig>;
using RequestContextPtr = std::shared_ptr<RequestContext>;

class ServerConfig
{
public:
    ServerConfig(int portVal, bool allowRemoteVal);
    ~ServerConfig();

    const int port;
    const bool allowRemote;

    Router router;
    RequestFilterChain filters;

private:
    MSRV_NO_COPY_AND_ASSIGN(ServerConfig);
};

struct RequestContext
{
    RequestContext()
        : corereq(nullptr),
          workQueue(nullptr),
          eventStreamResponse(nullptr)
    {
    }

    RequestCore* corereq;
    Request request;
    std::weak_ptr<Server> server;
    WorkQueue* workQueue;
    EventStreamResponse* eventStreamResponse;
    Json lastEvent;

    bool isAlive() const { return corereq != nullptr; }
    Response* response() { return request.response.get(); }
};

class Server
    : public std::enable_shared_from_this<Server>,
      private RequestEventListener
{
public:
    static DurationMs pingEventPeriod() { return std::chrono::seconds(15); }
    static DurationMs eventDispatchDelay() { return DurationMs(20); }

    Server(ServerCorePtr core, ServerConfigPtr config);
    ~Server();

    void run()
    {
        threadId_ = std::this_thread::get_id();
        core_->run();
    }

    void exit()
    {
        core_->exit();
    }

    void dispatchEvents();

    boost::unique_future<void> destroyed() { return destroyed_.get_future(); }

private:
    static void produceEvent(RequestContext* context);

    RequestContextPtr createContext(RequestCore* corereq);

    void sendEvent(RequestContextPtr context);
    void sendResponse(RequestContextPtr context);

    void runHandlerAndProcessResponse(RequestContextPtr context);
    void processResponse(RequestContextPtr request);

    void doDispatchEvents();
    void beginSendEventStream(RequestContextPtr context);
    void produceAndSendEvent(RequestContextPtr context);

    virtual void onRequestReady(RequestCore* corereq) override;
    virtual void onRequestDone(RequestCore* corereq) override;

    void registerContext(RequestContextPtr context)
    {
        auto evreq = context->corereq;
        contexts_.emplace(evreq, std::move(context));
    }

    void assertIsServerThread()
    {
        assert(threadId_ == std::this_thread::get_id());
    }

    ServerCorePtr core_;
    ServerConfigPtr config_;
    std::unordered_map<RequestCore*, RequestContextPtr> contexts_;
    std::unordered_map<RequestCore*, RequestContextPtr> eventStreamContexts_;
    std::atomic_bool dispatchEventsRequested_;
    TimerPtr dispatchEventsTimer_;
    std::thread::id threadId_;
    boost::promise<void> destroyed_;

    MSRV_NO_COPY_AND_ASSIGN(Server);
};

}
