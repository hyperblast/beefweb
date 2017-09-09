#include "request_filter.hpp"
#include "log.hpp"
#include "request.hpp"
#include "response.hpp"
#include "fnv_hash.hpp"

namespace msrv {

namespace {

namespace headers {

const char IfNoneMatch[] = "If-None-Match";
const char ETag[] = "ETag";
const char CacheControl[] = "Cache-Control";

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

CacheSupportFilter::CacheSupportFilter() = default;
CacheSupportFilter::~CacheSupportFilter() = default;

void CacheSupportFilter::endRequest(Request* request)
{
    FileResponse* fileResponse = dynamic_cast<FileResponse*>(request->response.get());

    if (!fileResponse)
        return;

    auto etagValue = getETag(fileResponse);
    auto ifNoneMatchHeader = request->headers.find(headers::IfNoneMatch);

    if (ifNoneMatchHeader != request->headers.end() &&
        ifNoneMatchHeader->second == etagValue)
    {
        request->response = Response::custom(HttpStatus::S_304_NOT_MODIFIED);
        return;
    }

    fileResponse->headers[headers::CacheControl] = "max-age=0, must-revalidate";
    fileResponse->headers[headers::ETag] = etagValue;
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
