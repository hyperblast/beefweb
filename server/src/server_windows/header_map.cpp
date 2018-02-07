#include "header_map.hpp"

namespace msrv {
namespace server_windows {

void mapRequestHeaders(
    const ::HTTP_REQUEST_HEADERS* from,
    HttpKeyValueMap& to)
{
}

void mapResponseHeaders(
    const HttpKeyValueMap& from,
    ::HTTP_RESPONSE_HEADERS* to,
    std::vector<::HTTP_UNKNOWN_HEADER>& toUnknown)
{
}

}}
