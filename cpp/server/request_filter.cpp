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
bool guardedCall(Request* request, Func&& func)
{
    try
    {
        func();
        return true;
    }
    catch (InvalidRequestException& ex)
    {
        if (!hasErrorResponse(request))
            request->response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());

        request->setProcessed();
        return false;
    }
    catch (std::exception& ex)
    {
        logError("%s", ex.what());

        if (!hasInternalErrorResponse(request))
            request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, ex.what());

        request->setProcessed();
        return false;
    }
    catch (...)
    {
        logError("unknown error");

        if (!hasInternalErrorResponse(request))
            request->response = Response::error(HttpStatus::S_500_SERVER_ERROR, "unknown error");

        request->setProcessed();
        return false;
    }
}

}

void ExecuteHandlerFilter::beginRequest(Request* request)
{
    request->executeHandler();
}

RequestFilterChain::RequestFilterChain() = default;
RequestFilterChain::~RequestFilterChain() = default;

void RequestFilterChain::add(RequestFilterPtr filter)
{
    filters_.emplace_back(std::move(filter));
}

void RequestFilterChain::beginRequest(Request* request) const
{
    int current = -1;

    for (auto& filter: filters_)
    {
        current++;

        if (guardedCall(request, [&] { filter->beginRequest(request); }))
        {
            request->lastFilter = current;

            if (request->isProcessed())
            {
                return;
            }
        }
        else
        {
            // guardedCall() marked response as processed
            return;
        }
    }

    request->setProcessed();
}

void RequestFilterChain::endRequest(Request* request) const
{
    for (int i = request->lastFilter; i >= 0; i--)
    {
        guardedCall(request, [&] { filters_[i]->endRequest(request); });
    }
}

}
