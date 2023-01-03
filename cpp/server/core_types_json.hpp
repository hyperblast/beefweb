#pragma once

#include "core_types.hpp"
#include "json.hpp"

namespace msrv {

void to_json(Json& json, const Switch& value);
void from_json(const Json& json, Switch& value);

void to_json(Json& json, const Range& value);
void from_json(const Json& json, Range& value);

}
