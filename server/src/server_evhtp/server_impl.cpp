#include "server_impl.hpp"
#include "libevent_glue.hpp"
#include "libevhtp_glue.hpp"

#include "../http.hpp"
#include "../router.hpp"
#include "../request_filter.hpp"
#include "../log.hpp"
#include "../settings.hpp"
#include "../system.hpp"
#include "../file_system.hpp"
#include "../util.hpp"

#include <assert.h>
#include <stdio.h>

#include <atomic>
#include <thread>
#include <mutex>
#include <memory>
#include <unordered_map>

namespace msrv {

ServerPtr Server::create(
    const Router *router,
    const RequestFilterChain* filters,
    WorkQueue* defaultWorkQueue,
    ServerRestartCallback restartCallback)
{
    return ServerPtr(new server_evhtp::ServerImpl(
        router, filters, defaultWorkQueue, std::move(restartCallback)));
}

namespace server_evhtp {

ServerImpl::ServerImpl(
    const Router* router,
    const RequestFilterChain* filters,
    WorkQueue* defaultWorkQueue,
    ServerRestartCallback restartCallback)
    : router_(router),
      filters_(filters),
      defaultWorkQueue_(defaultWorkQueue),
      lastRequestId_(0),
      restartCallback_(std::move(restartCallback)),
      pendingCommand_(ServerCommand::NONE)
{
    EventBase::initThreads();

    eventBase_.reset(new EventBase());
    eventBase_->makeNotifiable();
    eventBase_->initPriorities(2);

    ioQueue_.reset(new EventBaseWorkQueue(eventBase_.get(), 1));

    commandEvent_ = createEvent([this] (Event*,int) { processCommand(); }, 0);
    pollEventSourcesEvent_ = createEvent([this] (Event*, int) { doPollEventSources(); });
    keepEventLoopEvent_ = createEvent(EventCallback(), 1, EV_PERSIST);
    keepEventLoopEvent_->schedule(60);

    thread_ = std::thread([this]
    {
        tryCatchLog([this]{ eventBase_->runLoop(); });
    });
}

ServerImpl::~ServerImpl()
{
    if (thread_.joinable())
    {
        shutdown();
        thread_.join();
    }
}

void ServerImpl::pollEventSources()
{
    bool expected = false;

    if (pollEventSourcesRequested_.compare_exchange_strong(expected, true))
        pollEventSourcesEvent_->schedule(0, 20000);
}

void ServerImpl::restart(const SettingsData& settings)
{
    {
        std::lock_guard<std::mutex> lock(commandMutex_);

        if (pendingCommand_ == ServerCommand::SHUTDOWN ||
            pendingCommand_ == ServerCommand::SHUTDOWN_COMPLETE)
            return;

        std::unique_ptr<SettingsData> settingsCopy(new SettingsData(settings));

        pendingCommand_ = ServerCommand::RESTART;
        pendingSettings_ = std::move(settingsCopy);
    }

    commandEvent_->schedule();
}

EvhtpHostPtr ServerImpl::createHost(const char* address, int port)
{
    EvhtpHostPtr host(new EvhtpHost(eventBase_.get()));
    host->onNewRequest([this] (EvhtpRequest* req) { processRequest(req); });
    host->bind(address, port, 64);
    logInfo("listening on [%s]:%d", address, port);
    return host;
}

EventPtr ServerImpl::createEvent(EventCallback cb, int prio, int events)
{
    EventPtr event(new Event(eventBase_.get(), SocketHandle(), events));
    event->onEvent(std::move(cb));
    event->setPriority(prio);
    return event;
}

void ServerImpl::doStart(const SettingsData& settings)
{
    tryCatchLog([&]
    {
        hostV4_ = createHost(settings.allowRemote ? "ipv4:0.0.0.0" : "ipv4:127.0.0.1", settings.port);
    });

    tryCatchLog([&]
    {
        hostV6_ = createHost(settings.allowRemote ? "ipv6:::0" : "ipv6:::1", settings.port);
    });

    if ((hostV4_ || hostV6_) && restartCallback_)
        tryCatchLog([&]{ restartCallback_(settings); });
}

void ServerImpl::doStop()
{
    std::vector<EvhtpRequest*> requests;

    for (auto& it : evreqMap_)
        requests.push_back(it.second);

    for (auto evreq : requests)
        evreq->abort();

    assert(evreqMap_.empty());
    assert(requestMap_.empty());
    assert(eventStreamResponses_.empty());

    hostV4_.reset();
    hostV6_.reset();
}

void ServerImpl::shutdown()
{
    {
        std::lock_guard<std::mutex> lock(commandMutex_);

        assert(pendingCommand_ != ServerCommand::SHUTDOWN
            && pendingCommand_ != ServerCommand::SHUTDOWN_COMPLETE);

        pendingCommand_ = ServerCommand::SHUTDOWN;
    }

    commandEvent_->schedule();
}

void ServerImpl::processRequest(EvhtpRequest* evreq)
{
    evreq->id = ++lastRequestId_;

    RequestSharedPtr request = createRequest(evreq);

    if (request->isProcessed())
    {
        processResponse(evreq, std::move(request));
        return;
    }

    WorkQueue* workQueue = getWorkQueue(request->handler.get());
    RequestWeakPtr requestWeak(request);
    trackRequest(evreq, request);

    workQueue->enqueue([this, requestWeak]
    {
        RequestSharedPtr request1 = requestWeak.lock();
        if (!request1)
            return;

        filters_->execute(request1.get());

        ioQueue_->enqueue([this, requestWeak]
        {
            RequestSharedPtr request2 = requestWeak.lock();
            if (!request2)
                return;

            auto evreqEntry = evreqMap_.find(request2->id);
            if (evreqEntry == evreqMap_.end())
                return;

            processResponse(evreqEntry->second, request2);
        });
    });
}

void ServerImpl::processResponse(EvhtpRequest* evreq, RequestSharedPtr request)
{
    Response* response = request->response.get();

    if (auto eventStreamResponse = dynamic_cast<EventStreamResponse*>(response))
    {
        processEventStreamResponse(evreq, eventStreamResponse);
        return;
    }

    if (auto asyncResponse = dynamic_cast<AsyncResponse*>(response))
    {
        processAsyncResponse(evreq, request, asyncResponse);
        return;
    }

    ResponseFormatter(evreq).format(response);
}

void ServerImpl::processAsyncResponse(EvhtpRequest*, RequestSharedPtr request, AsyncResponse* asyncResponse)
{
    RequestWeakPtr requestWeak(request);

    asyncResponse->responseFuture.then(
        boost::launch::sync, [this, requestWeak] (ResponseFuture resp)
    {
        ResponsePtr response = AsyncResponse::unpack(std::move(resp));

        RequestSharedPtr request1 = requestWeak.lock();
        if (!request1)
            return;

        request1->response = std::move(response);

        ioQueue_->enqueue([this, requestWeak]
        {
            RequestSharedPtr request2 = requestWeak.lock();
            if (!request2)
                return;

            auto evreqEntry = evreqMap_.find(request2->id);
            if (evreqEntry == evreqMap_.end())
                return;

            processResponse(evreqEntry->second, std::move(request2));
        });
    });
}

void ServerImpl::processEventStreamResponse(EvhtpRequest* evreq, EventStreamResponse* streamResponse)
{
    eventStreamResponses_.emplace(evreq->id);
    evreq->outputHeaders()->set("Content-Type", "text/event-stream");
    evreq->sendResponseBegin(static_cast<int>(HttpStatus::S_200_OK));
    sendEvent(evreq, streamResponse);
}

void ServerImpl::doPollEventSources()
{
    pollEventSourcesRequested_.store(false);

    for (auto id : eventStreamResponses_)
    {
        auto* evreq = evreqMap_[id];
        RequestSharedPtr request = requestMap_[id];
        auto* response = request->response.get();
        auto* eventStreamResponse = dynamic_cast<EventStreamResponse*>(response);

        if (eventStreamResponse)
            sendEvent(evreq, eventStreamResponse);
    }
}

void ServerImpl::processCommand()
{
    bool wantStart = false;
    bool wantStop = false;
    bool wantExit = false;

    std::unique_ptr<SettingsData> settings;

    {
        std::lock_guard<std::mutex> lock(commandMutex_);

        switch (pendingCommand_)
        {
        case ServerCommand::RESTART:
            wantStart = true;
            wantStop = true;
            pendingCommand_ = ServerCommand::NONE;
            settings = std::move(pendingSettings_);
            break;

        case ServerCommand::SHUTDOWN:
            wantStop = true;
            wantExit = true;
            pendingCommand_ = ServerCommand::SHUTDOWN_COMPLETE;
            break;

        default:
            break;
        }
    }

    if (wantStop)
        doStop();

    if (wantStart)
    {
        assert(settings);

        doStart(*settings);
    }

    if (wantExit)
        eventBase_->breakLoop();
}

RequestSharedPtr ServerImpl::createRequest(EvhtpRequest* evreq)
{
    RequestSharedPtr req = std::make_shared<Request>();

    req->id = evreq->id;

    switch (evreq->method())
    {
    case htp_method_GET:
        req->method = HttpMethod::GET;
        break;

    case htp_method_POST:
        req->method = HttpMethod::POST;
        break;

    default:
        req->response = Response::error(HttpStatus::S_405_METHOD_NOT_ALLOWED);
        req->setProcessed();
        return req;
    }

    req->path = evreq->path();
    req->headers = evreq->inputHeaders()->toMap<HttpKeyValueMap>();
    req->queryParams = evreq->queryParams()->toMap<HttpKeyValueMap>();

    if (evreq->inputBuffer()->length() > 0)
    {
        auto postDataBuf = evreq->inputBuffer()->readToEnd();

        try
        {
            req->postData = Json::parse(postDataBuf);
        }
        catch (std::exception& ex)
        {
            req->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());
            req->setProcessed();
            return req;
        }
    }

    auto routeResult = router_->dispatch(req.get());

    if (routeResult->factory)
    {
        req->handler = routeResult->factory->createHandler(req.get());
        req->routeParams = std::move(routeResult->params);
    }
    else
    {
        req->response = std::move(routeResult->errorResponse);
        req->setProcessed();
    }

    return req;
}

void ServerImpl::trackRequest(EvhtpRequest* evreq, RequestSharedPtr req)
{
    assert(evreq->id == req->id);

    evreq->onDestroy([this] (EvhtpRequest* r)
    {
        eventStreamResponses_.erase(r->id);
        evreqMap_.erase(r->id);
        requestMap_.erase(r->id);
    });

    evreqMap_.emplace(evreq->id, evreq);
    requestMap_.emplace(evreq->id, std::move(req));
}

void ServerImpl::sendEvent(EvhtpRequest* evreq, EventStreamResponse* response)
{
    Json eventData;
    tryCatchLog([&]{ eventData = response->source(); });

    Evbuffer buffer;
    if (eventData.is_null())
    {
        buffer.write(": ping\n\n");
    }
    else
    {
        buffer.write("data: ");
        buffer.write(eventData.dump());
        buffer.write("\n\n");
    }

    evreq->sendResponseBody(&buffer);
}

ResponseFormatter::ResponseFormatter(EvhtpRequest* evreq)
    : evreq_(evreq)
{
}

ResponseFormatter::~ResponseFormatter()
{
}

void ResponseFormatter::format(Response* response)
{
    for (auto& header : response->headers)
        evreq_->outputHeaders()->set(header.first, header.second);

    response->process(this);

    evreq_->sendResponse(static_cast<int>(response->status));
}

void ResponseFormatter::handleResponse(SimpleResponse*)
{
    evreq_->outputHeaders()->set("Content-Type", "text/plain");
    evreq_->outputHeaders()->set("Content-Length", "0");
}

void ResponseFormatter::handleResponse(DataResponse* response)
{
    evreq_->outputHeaders()->set("Content-Type", response->contentType);
    evreq_->outputHeaders()->set("Content-Length", toString(response->data.size()));

    if (response->data.size() > 0)
        evreq_->outputBuffer()->write(response->data.data(), response->data.size());
}

void ResponseFormatter::handleResponse(FileResponse* response)
{
    evreq_->outputHeaders()->set("Content-Type", response->contentType);
    evreq_->outputHeaders()->set("Content-Length", toString(response->info.size));

    if (response->info.size > 0)
        evreq_->outputBuffer()->writeFile(std::move(response->handle), 0, response->info.size);
}

void ResponseFormatter::handleResponse(JsonResponse* response)
{
    writeJson(response->value);
}

void ResponseFormatter::handleResponse(ErrorResponse* response)
{
    writeJson(Json(*response));
}

void ResponseFormatter::handleResponse(EventStreamResponse*)
{
    throw std::logic_error("EventStreamResponse should not be handled by this object");
}

void ResponseFormatter::handleResponse(AsyncResponse*)
{
    throw std::logic_error("AsyncResponse should not be handled by this object");
}

void ResponseFormatter::writeJson(const Json& json)
{
    auto jsonString = json.dump();

    evreq_->outputHeaders()->set("Content-Type", "application/json");
    evreq_->outputHeaders()->set("Content-Length", toString(jsonString.length()));
    evreq_->outputBuffer()->write(jsonString);
}

}}
