#include "http.hpp"
#include "modp_burl.h"

namespace msrv {

namespace {

int parseHexDigit(int ch)
{
    if (ch >= '0' && ch <= '9')
        return ch - '0';
    if (ch >= 'a' && ch <= 'f')
        return ch - 'a' + 10;
    if (ch >= 'A' && ch <= 'F')
        return ch - 'A' + 10;
    return -1;
}

}

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

bool tryUnescapeUrl(StringView str, std::string& outVal)
{
    int state = 0;
    int first = 0;
    int second = 0;

    std::string result;

    for (size_t i = 0; i < str.length(); i++)
    {
        switch (state)
        {
        case 0:
            if (str[i] == '%')
                state = 1;
            else
                result.push_back(str[i]);
            continue;

        case 1:
            first = parseHexDigit(str[i]);
            if (first < 0)
                return false;
            state = 2;
            continue;

        case 2:
            second = parseHexDigit(str[i]);
            if (second < 0)
                return false;
            result.push_back((char)((first << 4) | second));
            state = 0;
            continue;
        }
    }

    outVal = std::move(result);

    return true;
}

HttpKeyValueMap parseQueryString(StringView str)
{
    HttpKeyValueMap map;

    if (!str.empty() && str.front() == '?')
        str = str.substr(1);

    Tokenizer params(str, '&');

    while (params.nextToken())
    {
        Tokenizer keyValue(params.token(), '=');

        std::string key;
        std::string value;

        if (keyValue.nextToken())
        {
            if (tryUnescapeUrl(keyValue.token(), key) &&
                tryUnescapeUrl(keyValue.input(), value))
            {
                map.emplace(std::move(key), std::move(value));
            }
        }
        else
        {
            if (tryUnescapeUrl(params.token(), key))
                map.emplace(std::move(key), std::move(value));
        }
    }

    return map;
}

}
