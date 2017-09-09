#include "request_filter.hpp"
#include "log.hpp"
#include "request.hpp"
#include "response.hpp"

namespace msrv {

RequestFilter::RequestFilter()
    : next_(nullptr) { }

RequestFilter::~RequestFilter() = default;

void RequestFilter::execute(Request* request)
{
    beginRequest(request);
    callNext(request);
    endRequest(request);
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

    try
    {
        filters_.front()->execute(request);
    }
    catch (InvalidRequestException& ex)
    {
        if (!request->response || isSuccessStatus(request->response->status))
            request->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());
    }
    catch (std::exception& ex)
    {
        logError("%s", ex.what());
        request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, ex.what());
    }
    catch (...)
    {
        logError("unknown error");
        request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, "unknown error");
    }

    request->setProcessed();
}

}
