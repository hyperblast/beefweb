#include "request_filter.hpp"
#include "log.hpp"
#include "request.hpp"
#include "response.hpp"
#include "fnv_hash.hpp"

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

std::string getETag(FileResponse* response)
{
    const auto& pathString = response->path.string();

    FnvHash hash;
    hash.addBytes(pathString.data(), pathString.size() * sizeof(Path::value_type));
    hash.addValue(response->info.size);
    hash.addValue(response->info.timestamp);
    hash.addValue(response->info.inode);

    std::stringstream etag;
    etag << '"' << std::hex << hash.value() << '"';
    return etag.str();
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

CacheSupportFilter::CacheSupportFilter() = default;
CacheSupportFilter::~CacheSupportFilter() = default;

void CacheSupportFilter::endRequest(Request* request)
{
    FileResponse* fileResponse = dynamic_cast<FileResponse*>(request->response.get());

    if (!fileResponse)
        return;

    auto etagValue = getETag(fileResponse);
    auto ifNoneMatchHeader = request->headers.find(HttpHeader::IF_NONE_MATCH);

    if (ifNoneMatchHeader != request->headers.end() &&
        ifNoneMatchHeader->second == etagValue)
    {
        request->response = Response::custom(HttpStatus::S_304_NOT_MODIFIED);
        return;
    }

    fileResponse->headers[HttpHeader::CACHE_CONTROL] = "max-age=0, must-revalidate";
    fileResponse->headers[HttpHeader::ETAG] = etagValue;
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
