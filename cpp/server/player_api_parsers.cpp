#include "player_api_parsers.hpp"

namespace msrv {

bool ValueParser<PlaylistRef>::tryParse(StringView str, PlaylistRef* outVal)
{
    if (str.empty())
        return false;

    int32_t index;

    if (tryParseValue(str, &index))
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
        *outVal = PlaylistRef(str.to_string());
        return true;
    }
}

}
