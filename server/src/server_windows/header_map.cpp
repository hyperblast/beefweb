#include "header_map.hpp"

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
    "Content-Md5",          // HttpHeaderContentMd5 = 16
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
}

}}
