#include "player_api_parsers.hpp"

namespace msrv {

bool ValueParser<PlaylistRef>::tryParse(StringSegment segment, PlaylistRef* outVal)
{
    if (!segment)
        return false;

    int32_t index;

    if (tryParseValue(segment, &index))
    {
        if (index >= 0)
        {
            *outVal = PlaylistRef(index);
            return true;
        }
        else
        {
            return false;
        }
    }
    else
    {
        *outVal = PlaylistRef(segment.toString());
        return true;
    }
}

}
