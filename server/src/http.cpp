#include "http.hpp"
#include "modp_burl.h"
#include "modp_qsiter.h"

namespace msrv {

const char HttpHeader::CONTENT_TYPE[] = "Content-Type";
const char HttpHeader::CONTENT_LENGTH[] = "Content-Length";
const char HttpHeader::AUTHORIZATION[] = "Authorization";
const char HttpHeader::WWW_AUTHENTICATE[] = "Www-Authenticate";
const char HttpHeader::IF_NONE_MATCH[] = "If-None-Match";
const char HttpHeader::ETAG[] = "ETag";
const char HttpHeader::CACHE_CONTROL[] = "Cache-Control";
const char HttpHeader::ACCEPT_ENCODING[] = "Accept-Encoding";
const char HttpHeader::CONTENT_ENCODING[] = "Content-Encoding";

std::string toString(HttpMethod method)
{
    switch (method)
    {
    case HttpMethod::UNDEFINED:
        return "undefined";
    case HttpMethod::GET:
        return "GET";
    case HttpMethod::POST:
        return "POST";
    default:
        return "invalid";
    }
}

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

    case HttpStatus::S_401_UNAUTHORIZED:
        return "401 Unauthorized";

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

std::string urlDecode(StringView str)
{
    std::string output;
    output.resize(modp_burl_decode_len(str.length()));

    auto outputSize = modp_burl_decode(&output[0], str.data(), str.length());
    output.resize(outputSize);

    return output;
}

HttpKeyValueMap parseQueryString(StringView str)
{
    HttpKeyValueMap map;

    if (!str.empty() && str.front() == '?')
        str = str.substr(1);

    qsiter_t iter;
    qsiter_reset(&iter, str.data(), str.length());

    while (qsiter_next(&iter))
    {
        auto key = urlDecode(StringView(iter.key, iter.keylen));

        if (key.empty())
            continue;

        auto value = urlDecode(StringView(iter.val, iter.vallen));

        map.emplace(std::move(key), std::move(value));
    }

    return map;
}

}
