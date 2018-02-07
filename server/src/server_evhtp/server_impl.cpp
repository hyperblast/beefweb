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

#include <assert.h>
#include <stdio.h>

#include <atomic>
#include <thread>
#include <mutex>
#include <memory>
#include <unordered_map>

namespace msrv {

ServerPtr Server::create(const ServerConfig* config)
{
    return std::make_shared<server_evhtp::ServerImpl>(config);
}

namespace server_evhtp {

ServerImpl::ServerImpl(const ServerConfig* config)
    : config_(*config)
{
    EventBase::initThreads();

    eventBase_.reset(new EventBase());
    eventBase_->makeNotifiable();
    ioQueue_ = std::make_unique<EventBaseWorkQueue>(eventBase_.get());

    dispatchEventsRequest_ = eventBase_->createEvent([this] (Event*, int) { doDispatchEvents(); });
    dispatchEventsRequest_->schedule();
    dispatchEventsRequested_.store(true);

    keepEventLoopEvent_ = eventBase_->createEvent(SocketHandle(), EV_PERSIST);
    keepEventLoopEvent_->schedule(std::chrono::minutes(1));

    tryCatchLog([this]
    {
        hostV4_ = createHost(
            config_.allowRemote ? "ipv4:0.0.0.0" : "ipv4:127.0.0.1",
            config_.port);
    });

    tryCatchLog([this]
    {
        hostV6_ = createHost(
            config_.allowRemote ? "ipv6:::0" : "ipv6:::1",
            config_.port);
    });

    if (!hostV4_ && !hostV6_)
        throw std::runtime_error("failed to bind to any address");
}

ServerImpl::~ServerImpl()
{
    std::vector<EvhtpRequest*> requests;

    requests.reserve(contexts_.size());

    for (auto& pair : contexts_)
        requests.push_back(pair.first);

    for (auto evreq : requests)
        evreq->abort();

    assert(contexts_.empty());
    assert(eventStreamContexts_.empty());
}

void ServerImpl::run()
{
    eventBase_->runLoop();
}

void ServerImpl::exit()
{
    eventBase_->breakLoop();
}

void ServerImpl::dispatchEvents()
{
    bool expected = false;

    if (dispatchEventsRequested_.compare_exchange_strong(expected, true))
        dispatchEventsRequest_->schedule(eventDispatchDelay());
}

EvhtpHostPtr ServerImpl::createHost(const char* address, int port)
{
    EvhtpHostPtr host(new EvhtpHost(eventBase_.get()));
    host->setRequestCallback([this] (EvhtpRequest* req) { processRequest(req); });
    host->bind(address, port, 64);
    logInfo("listening on [%s]:%d", address, port);
    return host;
}

void ServerImpl::processRequest(EvhtpRequest* evreq)
{
    RequestContextPtr context = createContext(evreq);

    if (context->request.isProcessed())
    {
        sendResponse(context.get());
        return;
    }

    registerContext(context);

    context->workQueue->enqueue([context]
    {
        if (auto server = context->server.lock())
            server->runHandlerAndProcessResponse(context);
    });
}

void ServerImpl::runHandlerAndProcessResponse(RequestContextPtr context)
{
    config_.filters->execute(&context->request);

    processResponse(context);
}

void ServerImpl::produceAndSendEvent(RequestContextPtr context)
{
    context->workQueue->enqueue([context]
    {
        produceEvent(context.get());

        if (auto server = context->server.lock())
        {
            server->ioQueue_->enqueue([context]
            {
                sendEvent(context.get());
            });
        }
    });
}

void ServerImpl::produceEvent(RequestContext* context)
{
    bool produced = tryCatchLog([context]
    {
        context->lastEvent = context->eventStreamResponse->source();
    });

    if (!produced)
        context->lastEvent = Json();
}

void ServerImpl::sendEvent(RequestContext* context)
{
    if (!context->isAlive())
        return;

    Evbuffer buffer;

    if (context->lastEvent.is_null())
    {
        buffer.write(": ping\n\n");
    }
    else
    {
        buffer.write("data: ");
        buffer.write(context->lastEvent.dump());
        buffer.write("\n\n");

        context->lastEvent = Json();
    }

    context->evreq->sendResponseBody(&buffer);
}

void ServerImpl::sendResponse(RequestContext* context)
{
    if (!context->isAlive())
        return;

    ResponseFormatter(context->evreq).format(context->response());
}

void ServerImpl::processResponse(RequestContextPtr context)
{
    Response* response = context->response();

    if (auto eventStreamResponse = dynamic_cast<EventStreamResponse*>(response))
    {
        context->eventStreamResponse = eventStreamResponse;
        produceEvent(context.get());

        ioQueue_->enqueue([context]
        {
            if (auto server = context->server.lock())
                server->beginSendEventStream(context);
        });

        return;
    }

     if (auto asyncResponse = dynamic_cast<AsyncResponse*>(response))
     {
         asyncResponse->responseFuture.then(
            boost::launch::sync, [context] (ResponseFuture resp)
         {
             context->request.response = AsyncResponse::unpack(std::move(resp));

             if (auto server = context->server.lock())
                 server->processResponse(context);
         });

         return;
     }

     ioQueue_->enqueue([context]
     {
         if (auto server = context->server.lock())
             server->sendResponse(context.get());
     });
}

void ServerImpl::beginSendEventStream(RequestContextPtr context)
{
    if (!context->isAlive())
        return;

    auto evreq = context->evreq;
    eventStreamContexts_.emplace(evreq, context);

    evreq->outputHeaders()->set("Content-Type", "text/event-stream");
    evreq->sendResponseBegin(static_cast<int>(HttpStatus::S_200_OK));

    sendEvent(context.get());
}

void ServerImpl::doDispatchEvents()
{
    dispatchEventsRequest_->schedule(pingEventPeriod());
    dispatchEventsRequested_.store(false);

    for (auto& pair : eventStreamContexts_)
        produceAndSendEvent(pair.second);
}

RequestContextPtr ServerImpl::createContext(EvhtpRequest* evreq)
{
    auto context = std::make_shared<RequestContext>();
    context->evreq = evreq;
    context->server = shared_from_this();

    auto* request = &context->request;

    switch (evreq->method())
    {
    case htp_method_GET:
        request->method = HttpMethod::GET;
        break;

    case htp_method_POST:
        request->method = HttpMethod::POST;
        break;

    default:
        request->response = Response::error(HttpStatus::S_405_METHOD_NOT_ALLOWED);
        request->setProcessed();
        return context;
    }

    request->path = evreq->path();
    request->headers = evreq->inputHeaders()->toMap<HttpKeyValueMap>();
    request->queryParams = evreq->queryParams()->toMap<HttpKeyValueMap>();

    if (evreq->inputBuffer()->length() > 0)
    {
        auto postDataBuf = evreq->inputBuffer()->readToEnd();

        try
        {
            request->postData = Json::parse(postDataBuf);
        }
        catch (std::exception& ex)
        {
            request->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());
            request->setProcessed();
            return context;
        }
    }

    auto routeResult = config_.router->dispatch(request);

    if (routeResult->factory)
    {
        request->handler = routeResult->factory->createHandler(request);
        request->routeParams = std::move(routeResult->params);

        context->workQueue = request->handler->workQueue();

        if (context->workQueue == nullptr)
            context->workQueue = config_.defaultWorkQueue;
    }
    else
    {
        request->response = std::move(routeResult->errorResponse);
        request->setProcessed();
    }

    return context;
}

void ServerImpl::registerContext(RequestContextPtr context)
{
    context->evreq->setDestroyCallback(
        [this] (EvhtpRequest* r) { unregisterContext(r); });

    auto evreq = context->evreq;
    contexts_.emplace(evreq, std::move(context));
}

void ServerImpl::unregisterContext(EvhtpRequest* evreq)
{
    eventStreamContexts_.erase(evreq);

    auto it = contexts_.find(evreq);
    if (it != contexts_.end())
    {
        it->second->evreq = nullptr;
        contexts_.erase(it);
    }
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
    {
        evreq_->outputBuffer()->write(
            reinterpret_cast<const char*>(response->data.data()),
            response->data.size());
    }
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
