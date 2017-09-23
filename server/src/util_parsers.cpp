#include "util_parsers.hpp"

namespace msrv {

bool ValueParser<Range>::tryParse(StringSegment segment, Range* outVal)
{
    int32_t offset;
    int32_t count;

    auto str = segment.data();
    auto len = segment.length();

    auto delim = segment.find(':');

    if (!delim)
    {
        if (!tryParseValue(segment, &offset))
            return false;

        *outVal = Range(offset, 1);
        return true;
    }

    auto offsetLen = delim - str;
    auto countLen = len - offsetLen - 1;

    if (!tryParseValue(StringSegment(str, offsetLen), &offset))
        return false;

    if (!tryParseValue(StringSegment(delim + 1, countLen), &count))
        return false;

    *outVal = Range(offset, count);
    return true;
}

bool ValueParser<Switch>::tryParse(StringSegment segment, Switch* outVal)
{
    switch (segment.length())
    {
    case 4:
        if (::memcmp(segment.data(), "true", 4) == 0)
        {
            *outVal = Switch::TRUE;
            return true;
        }

        return false;

    case 5:
        if (::memcmp(segment.data(), "false", 5) == 0)
        {
            *outVal = Switch::FALSE;
            return true;
        }

        return false;

    case 6:
        if (::memcmp(segment.data(), "toggle", 6) == 0)
        {
            *outVal = Switch::TOGGLE;
            return true;
        }

        return false;

    default:
        return false;
    }
}

}
