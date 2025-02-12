#include "core_types_json.hpp"
#include "core_types_parsers.hpp"

#include <inttypes.h>

namespace msrv {

namespace {
constexpr char INVALID_SWITCH_VALUE[] = "invalid switch value";
}

void to_json(Json& json, const Switch& value)
{
    switch (value)
    {
    case Switch::SW_FALSE:
        json = false;
        break;

    case Switch::SW_TRUE:
        json = true;
        break;

    case Switch::SW_TOGGLE:
        json = "toggle";
        break;

    default:
        throw std::invalid_argument(INVALID_SWITCH_VALUE);
    }
}

void from_json(const Json& json, Switch& value)
{
    if (json.is_boolean())
    {
        value = json.get<bool>() ? Switch::SW_TRUE : Switch::SW_FALSE;
        return;
    }

    if (json.is_string())
    {
        value = parseValue<Switch>(json.get_ref<const std::string&>());
        return;
    }

    throw std::invalid_argument(INVALID_SWITCH_VALUE);
}

void to_json(Json& json, const Range& range)
{
    json = formatString("%" PRId32 ":%" PRId32, range.offset, range.count);
}

void from_json(const Json& json, Range& value)
{
    if (json.is_number())
    {
        value = Range(json.get<int32_t>());
        return;
    }

    if (json.is_string())
    {
        value = parseValue<Range>(json.get_ref<const std::string&>());
        return;
    }

    throw std::invalid_argument("invalid range value");
}

}
