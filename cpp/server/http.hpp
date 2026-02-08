#pragma once

#include "defines.hpp"
#include "string_utils.hpp"

namespace msrv {

using HttpKeyValueMap = AsciiLowerCaseMap<std::string>;

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

struct ContentType
{
    static const char APPLICATION_OCTET_STREAM[];
    static const char APPLICATION_JSON[];
    static const char APPLICATION_JAVASCRIPT[];
    static const char TEXT_PLAIN_UTF8[];
    static const char TEXT_HTML_UTF8[];
    static const char TEXT_CSS[];
    static const char IMAGE_SVG[];
    static const char IMAGE_JPEG[];
    static const char IMAGE_PNG[];
    static const char IMAGE_GIF[];
    static const char IMAGE_BMP[];
    static const char APPLICATION_WEB_MANIFEST[];
};

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
