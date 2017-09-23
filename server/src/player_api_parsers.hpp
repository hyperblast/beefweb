#pragma once

#include "player_api.hpp"
#include "parsing.hpp"

namespace msrv {

template<>
struct ValueParser<PlaylistRef>
{
    static bool tryParse(StringSegment segment, PlaylistRef* outVal);
};

}
