#pragma once

#include "util.hpp"
#include "parsing.hpp"

namespace msrv {

template<>
struct ValueParser<Range>
{
    static bool tryParse(StringSegment segment, Range* outVal);
};

template<>
struct ValueParser<Switch>
{
    static bool tryParse(StringSegment segment, Switch* outVal);
};

}
