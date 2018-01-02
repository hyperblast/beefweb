#include "request_filter.hpp"
#include "log.hpp"
#include "request.hpp"
#include "response.hpp"

namespace msrv {

namespace {

inline bool hasErrorResponse(Request* request)
{
    return request->response && !isSuccessStatus(request->response->status);
}

inline bool hasInternalErrorResponse(Request* request)
{
    return request->response && request->response->status == HttpStatus::S_500_SERVER_ERROR;
}

template<typename Func>
void guardedCall(Request* request, Func func)
{
    try
    {
        func();
    }
    catch (InvalidRequestException& ex)
    {
        if (!hasErrorResponse(request))
            request->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());

        request->setProcessed();
    }
    catch (std::exception& ex)
    {
        logError("%s", ex.what());

        if (!hasInternalErrorResponse(request))
            request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, ex.what());

        request->setProcessed();
    }
    catch (...)
    {
        logError("unknown error");

        if (!hasInternalErrorResponse(request))
            request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, "unknown error");

        request->setProcessed();
    }
}

}

RequestFilter::RequestFilter()
    : next_(nullptr) { }

RequestFilter::~RequestFilter() = default;

void RequestFilter::execute(Request* request)
{
    guardedCall(request, [=] { beginRequest(request); });

    if (request->isProcessed())
        return;

    callNext(request);
    guardedCall(request, [=] { endRequest(request); });
}

void RequestFilter::callNext(Request* request)
{
    assert(next_);
    guardedCall(request, [&] { next_->execute(request); });
}

void RequestFilter::beginRequest(Request*) { }
void RequestFilter::endRequest(Request*) { }

ExecuteHandlerFilter::ExecuteHandlerFilter() = default;
ExecuteHandlerFilter::~ExecuteHandlerFilter() = default;

void ExecuteHandlerFilter::execute(Request* request)
{
    request->executeHandler();
}

RequestFilterChain::RequestFilterChain() = default;
RequestFilterChain::~RequestFilterChain() = default;

void RequestFilterChain::addFilter(RequestFilterPtr filter)
{
    RequestFilter* last = nullptr;

    if (!filters_.empty())
        last = filters_.back().get();

    filters_.emplace_back(std::move(filter));

    if (last)
        last->setNext(filters_.back().get());
}

void RequestFilterChain::execute(Request* request) const
{
    assert(!filters_.empty());
    guardedCall(request, [&] { filters_.front()->execute(request); });
    request->setProcessed();
}

}
