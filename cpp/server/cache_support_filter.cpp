#include "cache_support_filter.hpp"
#include "request.hpp"
#include "response.hpp"
#include "fnv_hash.hpp"

namespace msrv {

void CacheSupportFilter::endRequest(Request* request)
{
    auto response = request->response.get();
    auto etag = getEtag(response);

    if (etag.empty())
        return;

    auto ifNoneMatchValue = request->getHeader(HttpHeader::IF_NONE_MATCH);
    if (ifNoneMatchValue == etag)
    {
        auto notModifiedResponse = Response::custom(HttpStatus::S_304_NOT_MODIFIED);
        setCacheHeaders(notModifiedResponse.get(), etag);
        request->response = std::move(notModifiedResponse);
    }
    else
    {
        setCacheHeaders(response, etag);
    }
}

void CacheSupportFilter::setCacheHeaders(Response* response, const std::string& etag)
{
    response->headers[HttpHeader::CACHE_CONTROL] = "max-age=3, must-revalidate";
    response->headers[HttpHeader::ETAG] = etag;
}

std::string CacheSupportFilter::getEtag(Response* response)
{
    if (auto fileResponse = dynamic_cast<FileResponse*>(response))
        return formatHash(getHash(fileResponse));

    if (auto dataResponse = dynamic_cast<DataResponse*>(response))
        return formatHash(getHash(dataResponse));

    return {};
}

uint64_t CacheSupportFilter::getHash(DataResponse* response)
{
    FnvHash hash;
    hash.addBytes(response->data.data(), response->data.size());
    return hash.value();
}

uint64_t CacheSupportFilter::getHash(FileResponse* response)
{
    FnvHash hash;
    const auto& pathString = response->path.native();
    hash.addBytes(pathString.data(), pathString.size() * sizeof(Path::value_type));
    hash.addValue(response->info.size);
    hash.addValue(response->info.timestamp);
    hash.addValue(response->info.inode);
    return hash.value();
}

std::string CacheSupportFilter::formatHash(uint64_t hash)
{
    std::stringstream etag;
    etag << '"' << std::hex << hash << '"';
    return etag.str();
}

}
