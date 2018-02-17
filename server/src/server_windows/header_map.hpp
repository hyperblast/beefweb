#pragma once

#include "../http.hpp"
#include "../safe_windows.h"

#include <http.h>

namespace msrv {
namespace server_windows {

void mapRequestHeaders(
    const HTTP_REQUEST_HEADERS* from,
    HttpKeyValueMap* to);

void mapResponseHeaders(
    const HttpKeyValueMap* from,
    HTTP_RESPONSE_HEADERS* to,
    std::vector<HTTP_UNKNOWN_HEADER>* toUnknown);

}}
