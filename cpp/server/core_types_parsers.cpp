#include "core_types_parsers.hpp"

namespace msrv {

bool ValueParser<Range>::tryParse(StringView str, Range* outVal)
{
    int32_t offset;
    int32_t count;

    auto pos = str.find(':');

    if (pos == StringView::npos)
    {
        if (!tryParseValue(str, &offset))
            return false;

        if (offset < 0)
            return false;

        *outVal = Range(offset, 1);
        return true;
    }

    if (!tryParseValue(str.substr(0, pos), &offset))
        return false;

    if (!tryParseValue(str.substr(pos + 1), &count))
        return false;

    if (offset < 0 || count < 0)
        return false;

    *outVal = Range(offset, count);
    return true;
}

bool ValueParser<Switch>::tryParse(StringView str, Switch* outVal)
{
    switch (str.length())
    {
    case 4:
        if (::memcmp(str.data(), "true", 4) == 0)
        {
            *outVal = Switch::S_TRUE;
            return true;
        }

        return false;

    case 5:
        if (::memcmp(str.data(), "false", 5) == 0)
        {
            *outVal = Switch::S_FALSE;
            return true;
        }

        return false;

    case 6:
        if (::memcmp(str.data(), "toggle", 6) == 0)
        {
            *outVal = Switch::S_TOGGLE;
            return true;
        }

        return false;

    default:
        return false;
    }
}

}
