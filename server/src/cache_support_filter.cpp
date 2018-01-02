#include "cache_support_filter.hpp"
#include "request.hpp"
#include "response.hpp"
#include "fnv_hash.hpp"

namespace msrv {

CacheSupportFilter::CacheSupportFilter() = default;
CacheSupportFilter::~CacheSupportFilter() = default;

void CacheSupportFilter::endRequest(Request* request)
{
    FileResponse* fileResponse = dynamic_cast<FileResponse*>(request->response.get());

    if (!fileResponse)
        return;

    auto etagValue = calculateETag(fileResponse);
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

std::string CacheSupportFilter::calculateETag(FileResponse* response)
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
