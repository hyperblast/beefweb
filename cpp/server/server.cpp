#include "server.hpp"
#include "work_queue.hpp"
#include "log.hpp"
#include "response_sender.hpp"

namespace msrv {

ServerConfig::ServerConfig(int portVal, bool allowRemoteVal)
    : port(portVal), allowRemote(allowRemoteVal)
{
}

ServerConfig::~ServerConfig() = default;

Server::Server(ServerCorePtr core, ServerConfigPtr config)
    : core_(std::move(core)),
      config_(std::move(config)),
      dispatchEventsRequested_(true)
{
    core_->setEventListener(this);
    core_->bind(config_->port, config_->allowRemote);

    dispatchEventsTimer_ = core_->timerFactory()->createTimer();
    dispatchEventsTimer_->setCallback([this](Timer*) { doDispatchEvents(); });
    dispatchEventsTimer_->runOnce(eventDispatchDelay());
}

Server::~Server()
{
    std::vector<RequestCore*> requests;

    requests.reserve(contexts_.size());

    for (auto& pair: contexts_)
        requests.push_back(pair.first);

    for (auto corereq: requests)
        corereq->abort();

    dispatchEventsTimer_.reset();
    core_.reset();

    assert(contexts_.empty());
    assert(eventStreamContexts_.empty());

    destroyed_.set_value();
}

void Server::onRequestReady(RequestCore* corereq)
{
    RequestContextPtr context = createContext(corereq);
    corereq->releaseResources();

    if (context->request.isProcessed())
    {
        sendResponse(context);
        return;
    }

    registerContext(context);

    context->workQueue->enqueue([context] {
        if (auto server = context->server.lock())
            server->runHandlerAndProcessResponse(context);
    });
}

void Server::onRequestDone(RequestCore* corereq)
{
    eventStreamContexts_.erase(corereq);

    auto it = contexts_.find(corereq);
    if (it != contexts_.end())
    {
        it->second->corereq = nullptr;
        contexts_.erase(it);
    }
}

void Server::runHandlerAndProcessResponse(RequestContextPtr context)
{
    config_->filters.beginRequest(&context->request);

    processResponse(context);
}

void Server::produceAndSendEvent(RequestContextPtr context)
{
    context->workQueue->enqueue([context] {
        produceEvent(context.get());

        if (auto server1 = context->server.lock())
        {
            server1->core_->workQueue()->enqueue([context] {
                if (auto server2 = context->server.lock())
                    server2->sendEvent(context);
            });
        }
    });
}

void Server::produceEvent(RequestContext* context)
{
    bool produced = tryCatchLog([context] {
        context->lastEvent = context->eventStreamResponse->source();
    });

    if (!produced)
        context->lastEvent = Json();
}

void Server::sendEvent(RequestContextPtr context)
{
    assertIsServerThread();

    if (!context->isAlive())
        return;

    ResponseSender(context->corereq).sendEvent(std::move(context->lastEvent));
}

void Server::sendResponse(RequestContextPtr context)
{
    assertIsServerThread();

    if (!context->isAlive())
        return;

    ResponseSender(context->corereq).send(context->response());
}

void Server::processResponse(RequestContextPtr context)
{
    if (auto asyncResponse = dynamic_cast<AsyncResponse*>(context->response()))
    {
        asyncResponse->responseFuture.then(
            boost::launch::sync, [context](ResponseFuture resp) {
                auto nextResponse = AsyncResponse::unpack(std::move(resp));
                if (nextResponse)
                    nextResponse->addHeaders(context->response()->headers);

                context->request.response = std::move(nextResponse);

                if (auto server = context->server.lock())
                    server->processResponse(context);
            });

        return;
    }

    config_->filters.endRequest(&context->request);

    if (auto eventStreamResponse = dynamic_cast<EventStreamResponse*>(context->response()))
    {
        context->eventStreamResponse = eventStreamResponse;
        produceEvent(context.get());

        core_->workQueue()->enqueue([context] {
            if (auto server = context->server.lock())
                server->beginSendEventStream(context);
        });

        return;
    }

    core_->workQueue()->enqueue([context] {
        if (auto server = context->server.lock())
            server->sendResponse(context);
    });
}

void Server::beginSendEventStream(RequestContextPtr context)
{
    assertIsServerThread();

    if (!context->isAlive())
        return;

    eventStreamContexts_.emplace(context->corereq, context);

    ResponseSender(context->corereq).sendEventStream(
        context->eventStreamResponse, std::move(context->lastEvent));
}

void Server::dispatchEvents()
{
    bool expected = false;

    if (dispatchEventsRequested_.compare_exchange_strong(expected, true))
    {
        core_->workQueue()->enqueue([this] {
            dispatchEventsTimer_->runOnce(eventDispatchDelay());
        });
    }
}

void Server::doDispatchEvents()
{
    dispatchEventsRequested_.store(false);
    dispatchEventsTimer_->runOnce(pingEventPeriod());

    for (auto& pair: eventStreamContexts_)
        produceAndSendEvent(pair.second);
}

RequestContextPtr Server::createContext(RequestCore* corereq)
{
    auto context = std::make_shared<RequestContext>();
    context->corereq = corereq;
    context->server = shared_from_this();

    auto* request = &context->request;
    request->method = corereq->method();

    if (request->method == HttpMethod::UNDEFINED)
    {
        request->response = Response::error(HttpStatus::S_405_METHOD_NOT_ALLOWED);
        request->setProcessed();
        return context;
    }

    request->path = corereq->path();
    request->headers = corereq->headers();
    request->queryParams = corereq->queryParams();

    auto body = corereq->body();

    if (!body.empty())
    {
        try
        {
            request->postData = Json::parse(body);
        }
        catch (std::exception& ex)
        {
            request->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());
            request->setProcessed();
            return context;
        }
    }

    auto routeResult = config_->router.dispatch(request);

    if (auto factory = routeResult->factory)
    {
        request->handler = factory->createHandler(request);
        assert(request->handler);

        context->workQueue = factory->workQueue();
        if (context->workQueue == nullptr)
            context->workQueue = core_->workQueue();

        request->routeParams = std::move(routeResult->params);
    }
    else
    {
        request->response = std::move(routeResult->errorResponse);
        request->setProcessed();
    }

    return context;
}

}
