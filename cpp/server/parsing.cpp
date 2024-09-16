#include "parsing.hpp"

namespace msrv {

bool ValueParser<bool>::tryParse(StringView str, bool* outVal)
{
    switch (str.length())
    {
        case 4:
            if (::memcmp(str.data(), "true", 4) == 0)
            {
                *outVal = true;
                return true;
            }

            return false;

        case 5:
            if (::memcmp(str.data(), "false", 5) == 0)
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
