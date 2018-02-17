#include "header_map.hpp"
#include "../defines.hpp"

#include <assert.h>
#include <unordered_map>

namespace msrv {
namespace server_windows {

namespace {

const char* const REQUEST_HEADER_MAP[] =
{
    "Cache-Control",        // HttpHeaderCacheControl = 0
    "Connection",           // HttpHeaderConnection = 1
    "Date",                 // HttpHeaderDate = 2
    "Keep-Alive",           // HttpHeaderKeepAlive = 3
    "Pragma",               // HttpHeaderPragma = 4
    "Trailer",              // HttpHeaderTrailer = 5
    "Transfer-Encoding",    // HttpHeaderTransferEncoding = 6
    "Upgrade",              // HttpHeaderUpgrade = 7
    "Via",                  // HttpHeaderVia = 8
    "Warning",              // HttpHeaderWarning = 9,
    "Allow",                // HttpHeaderAllow = 10
    "Content-Length",       // HttpHeaderContentLength = 11
    "Content-Type",         // HttpHeaderContentType = 12
    "Content-Encoding",     // HttpHeaderContentEncoding = 13
    "Content-Language",     // HttpHeaderContentLanguage = 14
    "Content-Location",     // HttpHeaderContentLocation = 15
    "Content-MD5",          // HttpHeaderContentMd5 = 16
    "Content-Range",        // HttpHeaderContentRange = 17
    "Expires",              // HttpHeaderExpires = 18
    "Last-Modified",        // HttpHeaderLastModified = 19
    "Accept",               // HttpHeaderAccept = 20
    "Accept-Charset",       // HttpHeaderAcceptCharset = 21
    "Accept-Encoding",      // HttpHeaderAcceptEncoding = 22
    "Accept-Language",      // HttpHeaderAcceptLanguage = 23
    "Authorization",        // HttpHeaderAuthorization = 24
    "Cookie",               // HttpHeaderCookie = 25
    "Expect",               // HttpHeaderExpect = 26
    "From",                 // HttpHeaderFrom = 27
    "Host",                 // HttpHeaderHost = 28
    "If-Match",             // HttpHeaderIfMatch = 29
    "If-Modified-Since",    // HttpHeaderIfModifiedSince = 30
    "If-None-Match",        // HttpHeaderIfNoneMatch = 31
    "If-Range",             // HttpHeaderIfRange = 32
    "If-Unmodified-Since",  // HttpHeaderIfUnmodifiedSince = 33
    "Max-Forwards",         // HttpHeaderMaxForwards = 34
    "Proxy-Authorization",  // HttpHeaderProxyAuthorization = 35
    "Referer",              // HttpHeaderReferer = 36
    "Range",                // HttpHeaderRange = 37
    "Te",                   // HttpHeaderTe = 38
    "Translate",            // HttpHeaderTranslate = 39
    "User-Agent",           // HttpHeaderUserAgent = 40
};

class ResponseHeaderMap
{
public:
    static const ResponseHeaderMap* instance()
    {
        static ResponseHeaderMap map;
        return &map;
    }

    int getId(const std::string& key) const
    {
        auto it = map_.find(key);
        return it != map_.end() ? it->second : -1;
    }

private:
    ResponseHeaderMap()
    {
        map_.reserve(HttpHeaderResponseMaximum);

        add("Cache-Control", HttpHeaderCacheControl);
        add("Connection", HttpHeaderConnection);
        add("Date", HttpHeaderDate);
        add("Keep-Alive", HttpHeaderKeepAlive);
        add("Pragma", HttpHeaderPragma);
        add("Trailer", HttpHeaderTrailer);
        add("Transfer-Encoding", HttpHeaderTransferEncoding);
        add("Upgrade", HttpHeaderUpgrade);
        add("Via", HttpHeaderVia);
        add("Warning", HttpHeaderWarning);
        add("Allow", HttpHeaderAllow);
        add("Content-Length", HttpHeaderContentLength);
        add("Content-Type", HttpHeaderContentType);
        add("Content-Encoding", HttpHeaderContentEncoding);
        add("Content-Language", HttpHeaderContentLanguage);
        add("Content-Location", HttpHeaderContentLocation);
        add("Content-MD5", HttpHeaderContentMd5);
        add("Content-Range", HttpHeaderContentRange);
        add("Expires", HttpHeaderExpires);
        add("Last-Modified", HttpHeaderLastModified);
        add("Accept-Ranges", HttpHeaderAcceptRanges);
        add("Age", HttpHeaderAge);
        add("ETag", HttpHeaderEtag);
        add("Location", HttpHeaderLocation);
        add("Proxy-Authenticate", HttpHeaderProxyAuthenticate);
        add("Retry-After", HttpHeaderRetryAfter);
        add("Server", HttpHeaderServer);
        add("Set-Cookie", HttpHeaderSetCookie);
        add("Header-Vary", HttpHeaderVary);
        add("Www-Authenticate", HttpHeaderWwwAuthenticate);

        assert(map_.size() == HttpHeaderResponseMaximum);
    }

    void add(const char* key, int value)
    {
        map_.emplace(key, static_cast<USHORT>(value));
    }

    std::unordered_map<std::string, USHORT> map_;

    MSRV_NO_COPY_AND_ASSIGN(ResponseHeaderMap);
};

}

void mapRequestHeaders(
    const HTTP_REQUEST_HEADERS* from,
    HttpKeyValueMap* to)
{
    static_assert(
        sizeof(REQUEST_HEADER_MAP) / sizeof(REQUEST_HEADER_MAP[0]) == HttpHeaderRequestMaximum,
        "number of items in REQUEST_HEADER_MAP should be HttpHeaderRequestMaximum");

    for (int i = 0; i < HttpHeaderRequestMaximum; i++)
    {
        auto* header = &from->KnownHeaders[i];

        if (header->RawValueLength > 0)
        {
            to->emplace(
                REQUEST_HEADER_MAP[i],
                std::string(header->pRawValue, header->RawValueLength));
        }
    }

    for (int i = 0; i < from->UnknownHeaderCount; i++)
    {
        auto* header = &from->pUnknownHeaders[i];

        to->emplace(
            std::string(header->pName, header->NameLength),
            std::string(header->pRawValue, header->RawValueLength));
    }
}

void mapResponseHeaders(
    const HttpKeyValueMap* from,
    HTTP_RESPONSE_HEADERS* to,
    std::vector<HTTP_UNKNOWN_HEADER>* toUnknown)
{
    auto map = ResponseHeaderMap::instance();

    for (auto& pair : *from)
    {
        auto knownId = map->getId(pair.first);

        if (knownId >= 0)
        {
            auto* header = &to->KnownHeaders[knownId];
            header->pRawValue = pair.second.data();
            header->RawValueLength = static_cast<USHORT>(pair.second.length());
        }
        else
        {
            HTTP_UNKNOWN_HEADER header;
            header.pName = pair.first.data();
            header.NameLength = static_cast<USHORT>(pair.first.length());
            header.pRawValue = pair.second.data();
            header.RawValueLength = static_cast<USHORT>(pair.second.length());
            toUnknown->push_back(header);
        }
    }

    to->pUnknownHeaders = toUnknown->empty() ? nullptr : toUnknown->data();
    to->UnknownHeaderCount = static_cast<USHORT>(toUnknown->size());
}

}}
