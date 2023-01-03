#pragma once

#include "defines.hpp"
#include "string_utils.hpp"

#include <unordered_map>

namespace msrv {

enum class HttpMethod
{
    UNDEFINED,
    GET,
    POST,
    OPTIONS,
    COUNT,
};

enum class HttpStatus
{
    UNDEFINED = 0,
    S_200_OK = 200,
    S_202_ACCEPTED = 202,
    S_204_NO_CONTENT = 204,
    S_304_NOT_MODIFIED = 304,
    S_307_TEMP_REDIRECT = 307,
    S_308_PERM_REDIRECT = 308,
    S_400_BAD_REQUEST = 400,
    S_401_UNAUTHORIZED = 401,
    S_403_FORBIDDEN = 403,
    S_404_NOT_FOUND = 404,
    S_405_METHOD_NOT_ALLOWED = 405,
    S_500_SERVER_ERROR = 500,
    S_501_NOT_IMPLEMENTED = 501,
};

struct HttpHeader
{
    static const char CONTENT_TYPE[];
    static const char CONTENT_LENGTH[];
    static const char AUTHORIZATION[];
    static const char WWW_AUTHENTICATE[];
    static const char IF_NONE_MATCH[];
    static const char ETAG[];
    static const char CACHE_CONTROL[];
    static const char ACCEPT_ENCODING[];
    static const char CONTENT_ENCODING[];
    static const char LOCATION[];
};

using HttpKeyValueMap = std::unordered_map<std::string, std::string>;

std::string toString(HttpMethod method);
std::string toString(HttpStatus status);

inline bool isSuccessStatus(HttpStatus status)
{
    int code = static_cast<int>(status);
    return code >= 200 && code <= 299;
}

std::string urlDecode(StringView str);

HttpKeyValueMap parseQueryString(StringView str);

}
