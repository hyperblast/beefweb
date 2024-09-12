#pragma once

#include <nlohmann/json.hpp>

namespace msrv {

using Json = nlohmann::json;

inline std::string jsonDumpSafe(const Json& json)
{
    return json.dump(-1, ' ', false, Json::error_handler_t::replace);
}

}
