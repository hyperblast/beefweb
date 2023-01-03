#pragma once

#include "core_types.hpp"
#include "parsing.hpp"

namespace msrv {

template<>
struct ValueParser<Range>
{
    static bool tryParse(StringView str, Range* outVal);
};

template<>
struct ValueParser<Switch>
{
    static bool tryParse(StringView str, Switch* outVal);
};

}
