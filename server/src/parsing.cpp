#include "parsing.hpp"

namespace msrv {

bool ValueParser<bool>::tryParse(StringSegment segment, bool* outVal)
{
    switch (segment.length())
    {
    case 4:
        if (::memcmp(segment.data(), "true", 4) == 0)
        {
            *outVal = true;
            return true;
        }

        return false;

    case 5:
        if (::memcmp(segment.data(), "false", 5) == 0)
        {
            *outVal = false;
            return true;
        }

        return false;

    default:
        return false;
    }
}

}
