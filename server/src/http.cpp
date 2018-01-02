#include "http.hpp"
#include "util.hpp"

namespace msrv {

const char HttpHeader::IF_NONE_MATCH[] = "If-None-Match";
const char HttpHeader::ETAG[] = "ETag";
const char HttpHeader::CACHE_CONTROL[] = "Cache-Control";
const char HttpHeader::ACCEPT_ENCODING[] = "Accept-Encoding";
const char HttpHeader::CONTENT_ENCODING[] = "Content-Encoding";

std::string toString(HttpStatus status)
{
    switch (status)
    {
    case HttpStatus::UNDEFINED:
        return "Undefined";

    case HttpStatus::S_200_OK:
        return "200 OK";

    case HttpStatus::S_202_ACCEPTED:
        return "202 Accepted";

    case HttpStatus::S_204_NO_CONTENT:
        return "204 No content";

    case HttpStatus::S_304_NOT_MODIFIED:
        return "304 Not modified";

    case HttpStatus::S_400_BAD_REQUEST:
        return "400 Bad request";

    case HttpStatus::S_403_FORBIDDEN:
        return "403 Forbidden";

    case HttpStatus::S_404_NOT_FOUND:
        return "404 Not found";

    case HttpStatus::S_405_METHOD_NOT_ALLOWED:
        return "405 Method not allowed";

    case HttpStatus::S_500_SERVER_ERROR:
        return "500 Internal server error";

    case HttpStatus::S_501_NOT_IMPLEMENTED:
        return "501 Not implemented";

    default:
        return toString(static_cast<int>(status)) + "Status code";
    }
}

}
